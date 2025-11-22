import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getStaffMembers, generateDynamicPatients } from "./sampleData";
import { assignPatientsToNurses, generateRebalancingSuggestions, applySuggestion, type RebalancingSuggestion } from "./rebalancer";
import {
  initializeSimulation,
  runSimulationTick,
  getSimulationState,
  getSimulationStats,
  startSimulation,
  stopSimulation,
  resetSimulation,
  calculateBalanceMetric,
} from "./simulationEngine";
import { generateRecommendations, formatRecommendations } from "./recommendationEngine";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  staffflow: router({
    // Simulation control endpoints
    initSimulation: publicProcedure
      .input(z.object({ patientCount: z.number().optional() }).optional())
      .mutation(({ input }) => {
        return initializeSimulation(input?.patientCount || 30);
      }),

    runTick: publicProcedure.mutation(() => {
      return runSimulationTick();
    }),

    getSimulationState: publicProcedure.query(() => {
      return getSimulationState();
    }),

    getBalanceMetric: publicProcedure.query(() => {
      const state = getSimulationState();
      return calculateBalanceMetric(state.assignments);
    }),

    startSimulation: publicProcedure.mutation(() => {
      return startSimulation();
    }),

    stopSimulation: publicProcedure.mutation(() => {
      return stopSimulation();
    }),

    resetSimulation: publicProcedure
      .input(z.object({ patientCount: z.number().optional() }).optional())
      .mutation(({ input }) => {
        return resetSimulation(input?.patientCount || 30);
      }),

    getSimulationStats: publicProcedure.query(() => {
      return getSimulationStats();
    }),

    // Original endpoints
    /**
     * Get static staff with their skills and shifts
     */
    getStaffWithShifts: publicProcedure.query(async () => {
      const staff = getStaffMembers();
      return staff.map(s => ({
        id: s.id,
        name: s.name,
        qualifications: s.qualifications,
        maxPatients: s.maxPatients,
        maxWorkload: s.maxWorkload,
        unit: s.unit,
        shift: s.shift
      }));
    }),

    /**
     * Get current assignments with dynamic patient data
     * Optionally filter by unit
     */
    getAssignments: publicProcedure
      .input(z.object({ unit: z.string().optional() }).optional())
      .query(async ({ input }) => {
        // Use ACTUAL simulation state instead of generating random data
        const state = getSimulationState();
        
        if (!state || state.assignments.length === 0) {
          // Return empty if no simulation initialized
          return [];
        }

        let assignments = state.assignments;

        // Filter by unit if specified
        if (input?.unit) {
          assignments = assignments.filter(a => a.unit === input.unit);
        }

        return assignments;
      }),

    /**
     * Get rebalancing suggestions for current assignments
     */
    getRebalancingSuggestions: publicProcedure
      .input(z.object({ unit: z.string().optional() }).optional())
      .query(async ({ input }) => {
        // Use ACTUAL simulation state
        const state = getSimulationState();
        
        if (!state || state.assignments.length === 0) {
          return [];
        }

        let assignments = state.assignments;

        // Filter by unit if specified
        if (input?.unit) {
          assignments = assignments.filter(a => a.unit === input.unit);
        }

        // Generate suggestions
        const suggestions = generateRebalancingSuggestions(assignments);

        return {
          assignments,
          suggestions
        };
      }),

    /**
     * Get AI-powered recommendations using LLM
     */
    getRecommendations: publicProcedure
      .input(z.object({ unit: z.string().optional() }).optional())
      .query(async ({ input }) => {
        // Use ACTUAL simulation state instead of generating new data
        const state = getSimulationState();
        
        if (!state || state.assignments.length === 0) {
          return {
            assignments: [],
            suggestions: [],
            recommendations: [],
            formattedRecommendations: "No simulation data available. Please initialize the simulation first."
          };
        }

        let assignments = state.assignments;

        // Filter by unit if specified
        if (input?.unit) {
          assignments = assignments.filter(a => a.unit === input.unit);
        }

        // Generate suggestions based on ACTUAL simulation state
        const suggestions = generateRebalancingSuggestions(assignments);

        // Generate LLM recommendations
        const recommendations = await generateRecommendations(
          assignments,
          suggestions
        );

        return {
          assignments,
          suggestions,
          recommendations,
          formattedRecommendations: formatRecommendations(recommendations)
        };
      }),

    /**
     * Apply a rebalancing suggestion
     */
    applySuggestion: publicProcedure
      .input(
        z.object({
          fromNurseId: z.string(),
          toNurseId: z.string(),
          patientId: z.string(),
          unit: z.string().optional()
        })
      )
      .mutation(async ({ input }) => {
        const staff = getStaffMembers();
        const patients = generateDynamicPatients(15);

        // Assign patients to nurses
        let assignments = assignPatientsToNurses(patients, staff);

        // Filter by unit if specified
        if (input.unit) {
          assignments = assignments.filter(a => a.unit === input.unit);
        }

        // Create a suggestion object
        const suggestion: RebalancingSuggestion = {
          fromNurseId: input.fromNurseId,
          fromNurseName: assignments.find(a => a.nurseId === input.fromNurseId)
            ?.nurseName || "",
          toNurseId: input.toNurseId,
          toNurseName: assignments.find(a => a.nurseId === input.toNurseId)
            ?.nurseName || "",
          patientId: input.patientId,
          patientName: "",
          reason: "Manual transfer",
          expectedFromWorkload: 0,
          expectedToWorkload: 0,
          skillMatch: false
        };

        // Apply the suggestion
        const updatedAssignments = applySuggestion(assignments, suggestion);

        return {
          success: true,
          assignments: updatedAssignments
        };
      })
  }),
});

export type AppRouter = typeof appRouter;
