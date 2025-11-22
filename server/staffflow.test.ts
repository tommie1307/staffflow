import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createTestContext(): TrpcContext {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("staffflow.getAssignments", () => {
  it("returns assignments with new camelCase structure", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.staffflow.getAssignments();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    
    if (result.length > 0) {
      const assignment = result[0];
      expect(assignment).toHaveProperty("nurseId");
      expect(assignment).toHaveProperty("nurseName");
      expect(assignment).toHaveProperty("patients");
      expect(assignment).toHaveProperty("workload");
      expect(assignment).toHaveProperty("unit");
      expect(assignment).toHaveProperty("maxWorkload");
      expect(assignment).toHaveProperty("qualifications");
      expect(Array.isArray(assignment.patients)).toBe(true);
      
      // Verify maxWorkload is within expected range
      expect(assignment.maxWorkload).toBeGreaterThanOrEqual(6);
      expect(assignment.maxWorkload).toBeLessThanOrEqual(10);
    }
  }, 10000);

  it("filters assignments by unit", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.staffflow.getAssignments({ unit: "ICU" });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    
    // All assignments should be from the specified unit
    result.forEach(assignment => {
      expect(assignment.unit).toBe("ICU");
    });
  }, 10000);

  it("returns assignments with patient data", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Initialize simulation first (required for getAssignments to return data)
    await caller.staffflow.initSimulation({ patientCount: 30 });

    const result = await caller.staffflow.getAssignments();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    
    // At least one nurse should have patients
    const nursesWithPatients = result.filter(a => a.patients.length > 0);
    expect(nursesWithPatients.length).toBeGreaterThan(0);
    
    // Verify patient structure
    const firstPatient = nursesWithPatients[0]?.patients[0];
    if (firstPatient) {
      expect(firstPatient).toHaveProperty("id");
      expect(firstPatient).toHaveProperty("name");
      expect(firstPatient).toHaveProperty("acuity");
      expect(firstPatient).toHaveProperty("unit");
      expect(firstPatient.acuity).toBeGreaterThanOrEqual(1);
      expect(firstPatient.acuity).toBeLessThanOrEqual(5);
    }
  }, 10000);
});

describe("staffflow.getStaffWithShifts", () => {
  it("returns static staff with shift information", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.staffflow.getStaffWithShifts();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    
    const staff = result[0];
    expect(staff).toHaveProperty("id");
    expect(staff).toHaveProperty("name");
    expect(staff).toHaveProperty("qualifications");
    expect(staff).toHaveProperty("maxPatients");
    expect(staff).toHaveProperty("maxWorkload");
    expect(staff).toHaveProperty("unit");
    expect(staff).toHaveProperty("shift");
    
    // Verify shift structure
    expect(staff.shift).toHaveProperty("shiftType");
    expect(staff.shift).toHaveProperty("startTime");
    expect(staff.shift).toHaveProperty("endTime");
    expect(staff.shift).toHaveProperty("breaks");
    expect(Array.isArray(staff.shift.breaks)).toBe(true);
  }, 10000);
});

describe("staffflow.getRebalancingSuggestions", () => {
  it("returns rebalancing suggestions", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Initialize simulation first
    await caller.staffflow.initSimulation({ patientCount: 30 });

    const result = await caller.staffflow.getRebalancingSuggestions();

    expect(result).toBeDefined();
    expect(result).toHaveProperty("assignments");
    expect(result).toHaveProperty("suggestions");
    expect(Array.isArray(result.assignments)).toBe(true);
    expect(Array.isArray(result.suggestions)).toBe(true);
  }, 10000);

  it("filters suggestions by unit", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Initialize simulation first
    await caller.staffflow.initSimulation({ patientCount: 30 });

    const result = await caller.staffflow.getRebalancingSuggestions({ unit: "ER" });

    expect(result).toBeDefined();
    expect(result.assignments).toBeDefined();
    
    // All assignments should be from the specified unit
    result.assignments.forEach(assignment => {
      expect(assignment.unit).toBe("ER");
    });
  }, 10000);
});

describe("staffflow.getRecommendations", () => {
  it("returns AI-powered recommendations", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Initialize simulation first
    await caller.staffflow.initSimulation({ patientCount: 30 });

    const result = await caller.staffflow.getRecommendations();

    expect(result).toBeDefined();
    expect(result).toHaveProperty("assignments");
    expect(result).toHaveProperty("suggestions");
    expect(result).toHaveProperty("recommendations");
    expect(Array.isArray(result.assignments)).toBe(true);
    expect(Array.isArray(result.suggestions)).toBe(true);
    expect(Array.isArray(result.recommendations)).toBe(true);
  }, 15000);
});

describe("staffflow.applySuggestion", () => {
  it("applies a rebalancing suggestion", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Initialize simulation first
    await caller.staffflow.initSimulation({ patientCount: 30 });

    // First get suggestions
    const suggestionsResult = await caller.staffflow.getRebalancingSuggestions();
    
    if (suggestionsResult.suggestions.length > 0) {
      const suggestion = suggestionsResult.suggestions[0];
      
      const result = await caller.staffflow.applySuggestion({
        fromNurseId: suggestion.fromNurseId,
        toNurseId: suggestion.toNurseId,
        patientId: suggestion.patientId,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("success");
      expect(result.success).toBe(true);
      expect(result).toHaveProperty("assignments");
    }
  }, 15000);
});
