/**
 * Real-time simulation engine for hospital staffing
 * Simulates patient admissions, discharges, acuity changes, and automatic rebalancing
 */

import { STATIC_STAFF, type Patient, type StaffMember } from "./sampleData";
import { assignPatientsToNurses, generateRebalancingSuggestions, type Assignment } from "./rebalancer";
import { generateRandomName } from "./nameGenerator";

export interface WorkloadSnapshot {
  tick: number;
  nurseWorkloads: Record<string, { utilization: number; nurseName: string }>;
}

export interface SimulationState {
  patients: Patient[];
  assignments: Assignment[];
  lastUpdate: Date;
  tick: number;
  isRunning: boolean;
  workloadHistory: WorkloadSnapshot[];
}

// In-memory simulation state (will be persisted to DB later)
let simulationState: SimulationState = {
  patients: [],
  assignments: [],
  lastUpdate: new Date(),
  tick: 0,
  isRunning: false,
  workloadHistory: [],
};

/**
 * Create deliberately imbalanced initial assignments
 * Assigns ALL patients to only 2-3 nurses per unit to demonstrate clear overload
 */
function createImbalancedInitialAssignments(patients: Patient[]): Assignment[] {
  // Group patients by unit
  const patientsByUnit: Record<string, Patient[]> = {};
  for (const patient of patients) {
    if (!patientsByUnit[patient.unit]) {
      patientsByUnit[patient.unit] = [];
    }
    patientsByUnit[patient.unit].push(patient);
  }

  const assignments: Assignment[] = [];
  const assignedNurseIds = new Set<string>();

  // For each unit, assign ALL patients to only 2-3 nurses
  for (const [unit, unitPatients] of Object.entries(patientsByUnit)) {
    // Find nurses qualified for this unit who haven't been assigned yet
    const availableNurses = STATIC_STAFF.filter(nurse => 
      nurse.qualifications.includes(unit as any) && !assignedNurseIds.has(nurse.id)
    );

    if (availableNurses.length === 0) continue;

    // Pick only 1-2 nurses to overload (creates dramatic imbalance)
    const overloadedNurseCount = Math.min(2, Math.max(1, availableNurses.length));
    const overloadedNurses = availableNurses.slice(0, overloadedNurseCount);

    // Distribute ALL patients among these 2-3 nurses
    const nursePatients: Map<string, Patient[]> = new Map();
    
    unitPatients.forEach((patient, index) => {
      const targetNurse = overloadedNurses[index % overloadedNurses.length];
      
      if (!nursePatients.has(targetNurse.id)) {
        nursePatients.set(targetNurse.id, []);
      }
      nursePatients.get(targetNurse.id)!.push(patient);
      patient.assignedNurseId = targetNurse.id;
    });

    // Create assignments for overloaded nurses
    for (const [nurseId, patients] of Array.from(nursePatients.entries())) {
      const nurse = overloadedNurses.find(n => n.id === nurseId)!;
      const workload = patients.reduce((sum: number, p: Patient) => sum + p.acuity, 0);
      
      const maxPatients = nurse.maxPatients || 5;
      const isOverloaded = workload > nurse.maxWorkload || patients.length > maxPatients;
      const alert = isOverloaded 
        ? (patients.length > maxPatients ? "Too many patients!" : "Workload too high!")
        : "";
      
      assignments.push({
        nurseId: nurse.id,
        nurseName: nurse.name,
        unit: nurse.unit,
        patients,
        workload,
        maxWorkload: nurse.maxWorkload,
        maxPatients,
        isOverloaded,
        alert,
        qualifications: nurse.qualifications,
        shift: nurse.shift,
      });
      
      assignedNurseIds.add(nurse.id);
    }
  }

  // Add idle nurses (those not assigned any patients)
  for (const nurse of STATIC_STAFF) {
    if (!assignedNurseIds.has(nurse.id)) {
      assignments.push({
        nurseId: nurse.id,
        nurseName: nurse.name,
        unit: nurse.unit,
        patients: [],
        workload: 0,
        maxWorkload: nurse.maxWorkload,
        maxPatients: nurse.maxPatients || 5,
        isOverloaded: false,
        alert: "",
        qualifications: nurse.qualifications,
        shift: nurse.shift,
      });
    }
  }

  return assignments;
}

/**
 * Initialize simulation with starting patients
 */
export function initializeSimulation(initialPatientCount: number = 30): SimulationState {
  const patients: Patient[] = [];
  
  // Generate initial patient pool across all units
  const units = ["ICU", "ER", "MEDSURG", "PEDS"];
  for (let i = 0; i < initialPatientCount; i++) {
    const unit = units[i % units.length];
    const acuity = Math.floor(Math.random() * 5) + 1;
    patients.push({
      id: `patient-${Date.now()}-${i}`,
      name: generateRandomName(),
      acuity,
      unit: unit,
      condition: getConditionFromAcuity(acuity),
      requiredSkills: [unit]
    });
  }

  // Generate DELIBERATELY IMBALANCED initial assignments
  // Assign ALL patients to only 2-3 nurses to show clear problem
  const assignments = createImbalancedInitialAssignments(patients);

  simulationState = {
    patients,
    assignments,
    lastUpdate: new Date(),
    tick: 0,
    isRunning: true,
    workloadHistory: [],
  };

  return simulationState;
}

/**
 * Simulate patient admissions
 * Returns newly admitted patients
 */
function simulateAdmissions(): Patient[] {
  const newPatients: Patient[] = [];
  
  // Probability of admission per tick (30% chance)
  if (Math.random() < 0.3) {
    const units = ["ICU", "ER", "MEDSURG", "PEDS"];
    // Admit 1-3 patients
    const admissionCount = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < admissionCount; i++) {
      // Weight ER admissions higher (40%), others 20% each
      const rand = Math.random();
      let unit: string;
      if (rand < 0.4) unit = "ER";
      else if (rand < 0.6) unit = "ICU";
      else if (rand < 0.8) unit = "MEDSURG";
      else unit = "PEDS";
      
      const acuity = Math.floor(Math.random() * 5) + 1;
      newPatients.push({
        id: `patient-${Date.now()}-${i}`,
        name: generateRandomName(),
        acuity,
        unit: unit,
        condition: getConditionFromAcuity(acuity),
        requiredSkills: [unit]
      });
    }
  }

  return newPatients;
}

/**
 * Simulate patient discharges
 * Returns IDs of discharged patients
 */
function simulateDischarges(currentPatients: Patient[]): string[] {
  const dischargedIds: string[] = [];
  
  // Probability of discharge per patient (10% chance per tick)
  for (const patient of currentPatients) {
    // Lower acuity patients more likely to be discharged
    const dischargeChance = patient.acuity === 1 ? 0.2 : 
                           patient.acuity === 2 ? 0.15 :
                           patient.acuity === 3 ? 0.1 :
                           patient.acuity === 4 ? 0.05 : 0.02;
    
    if (Math.random() < dischargeChance) {
      dischargedIds.push(patient.id);
    }
  }

  return dischargedIds;
}

/**
 * Simulate acuity changes for existing patients
 */
function simulateAcuityChanges(patients: Patient[]): Patient[] {
  return patients.map(patient => {
    // 20% chance of acuity change per tick
    if (Math.random() < 0.2) {
      const change = Math.random() < 0.5 ? -1 : 1; // 50% improve, 50% worsen
      const newAcuity = Math.max(1, Math.min(5, patient.acuity + change));
      
      return {
        ...patient,
        acuity: newAcuity,
        condition: getConditionFromAcuity(newAcuity)
      };
    }
    return patient;
  });
}

/**
 * Get condition description based on acuity
 */
function getConditionFromAcuity(acuity: number): string {
  const conditions: Record<number, string[]> = {
    1: ["Stable", "Recovering Well", "Ready for Discharge"],
    2: ["Stable", "Improving", "Monitoring"],
    3: ["Moderate", "Stable", "Under Observation"],
    4: ["Serious", "Requires Attention", "Unstable"],
    5: ["Critical", "Life-Threatening", "Intensive Care"]
  };
  
  const options = conditions[acuity] || conditions[3];
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Dynamically reassign staff to units based on workload demand
 * Returns updated staff array with new unit assignments
 */
function reassignStaffToUnits(patients: Patient[]): StaffMember[] {
  // Calculate patient demand by unit
  const unitDemand: Record<string, { count: number; totalAcuity: number }> = {};
  
  for (const patient of patients) {
    if (!unitDemand[patient.unit]) {
      unitDemand[patient.unit] = { count: 0, totalAcuity: 0 };
    }
    unitDemand[patient.unit].count++;
    unitDemand[patient.unit].totalAcuity += patient.acuity;
  }

  // Create a copy of staff to modify
  const updatedStaff = STATIC_STAFF.map(staff => ({ ...staff }));

  // Calculate current staff distribution by unit
  const staffByUnit: Record<string, StaffMember[]> = {};
  for (const staff of updatedStaff) {
    if (!staffByUnit[staff.unit]) {
      staffByUnit[staff.unit] = [];
    }
    staffByUnit[staff.unit].push(staff);
  }

  // Identify overloaded and underloaded units
  const units = ["ICU", "ER", "MEDSURG", "PEDS"];
  
  for (const unit of units) {
    const demand = unitDemand[unit] || { count: 0, totalAcuity: 0 };
    const currentStaff = staffByUnit[unit] || [];
    const staffCount = currentStaff.length;
    
    // Calculate if unit needs more staff (demand > capacity)
    const avgWorkloadPerStaff = staffCount > 0 ? demand.totalAcuity / staffCount : 0;
    const avgMaxWorkload = staffCount > 0 
      ? currentStaff.reduce((sum, s) => sum + s.maxWorkload, 0) / staffCount 
      : 8;
    
    // Unit is overloaded if average workload > 70% of capacity
    if (avgWorkloadPerStaff > avgMaxWorkload * 0.7 && demand.count > 0) {
      // Try to pull staff from underutilized units
      for (const otherUnit of units) {
        if (otherUnit === unit) continue;
        
        const otherDemand = unitDemand[otherUnit] || { count: 0, totalAcuity: 0 };
        const otherStaff = staffByUnit[otherUnit] || [];
        
        if (otherStaff.length <= 1) continue; // Don't leave units with 0 staff
        
        const otherAvgWorkload = otherStaff.length > 0 
          ? otherDemand.totalAcuity / otherStaff.length 
          : 0;
        const otherAvgMax = otherStaff.length > 0
          ? otherStaff.reduce((sum, s) => sum + s.maxWorkload, 0) / otherStaff.length
          : 8;
        
        // Other unit is underutilized if workload < 40% of capacity
        if (otherAvgWorkload < otherAvgMax * 0.4) {
          // Find a staff member qualified for the overloaded unit
          const availableStaff = otherStaff.find(s => 
            s.qualifications.includes(unit)
          );
          
          if (availableStaff) {
            // Reassign this staff member to the overloaded unit
            availableStaff.unit = unit;
            
            // Update staffByUnit tracking
            staffByUnit[otherUnit] = staffByUnit[otherUnit].filter(s => s.id !== availableStaff.id);
            if (!staffByUnit[unit]) staffByUnit[unit] = [];
            staffByUnit[unit].push(availableStaff);
            
            break; // Only move one staff per tick to avoid over-correction
          }
        }
      }
    }
  }

  return updatedStaff;
}

/**
 * Simulate unit transfers
 * Returns patients with updated units
 */
function simulateUnitTransfers(patients: Patient[]): Patient[] {
  return patients.map(patient => {
    // 5% chance of transfer per tick
    if (Math.random() < 0.05) {
      // Transfer based on acuity
      let newUnit: string;
      if (patient.acuity >= 4) {
        newUnit = "ICU"; // Critical patients to ICU
      } else if (patient.acuity === 1) {
        newUnit = "MEDSURG"; // Stable patients to Med-Surg
      } else {
        // Random transfer otherwise
        const units = ["ICU", "ER", "MEDSURG", "PEDS"];
        newUnit = units[Math.floor(Math.random() * units.length)];
      }
      
      if (newUnit !== patient.unit) {
        return { ...patient, unit: newUnit };
      }
    }
    return patient;
  });
}

/**
 * Run one simulation tick
 * Updates patient pool, acuity, assignments, and performs rebalancing
 */
export function runSimulationTick(): SimulationState {
  if (!simulationState.isRunning) {
    return simulationState;
  }

  const currentTick = simulationState.tick + 1;
  
  // Progressive convergence: reduce randomness as ticks increase
  const convergenceFactor = Math.min(currentTick / 20, 1); // Reaches 1.0 at tick 20
  const randomnessFactor = 1 - convergenceFactor * 0.7; // Reduces to 30% of original

  // 1. Simulate discharges (reduced over time for stability)
  const dischargedIds: string[] = [];
  for (const patient of simulationState.patients) {
    const baseDischargeChance = patient.acuity === 1 ? 0.2 : 
                               patient.acuity === 2 ? 0.15 :
                               patient.acuity === 3 ? 0.1 :
                               patient.acuity === 4 ? 0.05 : 0.02;
    const adjustedDischargeChance = baseDischargeChance * randomnessFactor;
    
    if (Math.random() < adjustedDischargeChance) {
      dischargedIds.push(patient.id);
    }
  }
  let patients = simulationState.patients.filter(p => !dischargedIds.includes(p.id));

  // 2. Simulate admissions (reduced over time for stability)
  const baseAdmissionChance = 0.3;
  const adjustedAdmissionChance = baseAdmissionChance * randomnessFactor;
  
  if (Math.random() < adjustedAdmissionChance) {
    const units = ["ICU", "ER", "MEDSURG", "PEDS"];
    const admissionCount = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < admissionCount; i++) {
      const rand = Math.random();
      let unit: string;
      if (rand < 0.4) unit = "ER";
      else if (rand < 0.6) unit = "ICU";
      else if (rand < 0.8) unit = "MEDSURG";
      else unit = "PEDS";
      
      const acuity = Math.floor(Math.random() * 5) + 1;
      patients.push({
        id: `patient-${Date.now()}-${i}`,
        name: generateRandomName(),
        acuity,
        unit: unit,
        condition: getConditionFromAcuity(acuity),
        requiredSkills: [unit]
      });
    }
  }

  // 3. Simulate acuity changes (reduced over time)
  const acuityChangeChance = 0.2 * randomnessFactor;
  patients = patients.map(patient => {
    if (Math.random() < acuityChangeChance) {
      const change = Math.random() < 0.5 ? -1 : 1;
      const newAcuity = Math.max(1, Math.min(5, patient.acuity + change));
      
      return {
        ...patient,
        acuity: newAcuity,
        condition: getConditionFromAcuity(newAcuity)
      };
    }
    return patient;
  });

  // 4. Simulate unit transfers (reduced over time)
  const transferChance = 0.05 * randomnessFactor;
  patients = patients.map(patient => {
    if (Math.random() < transferChance) {
      let newUnit: string;
      if (patient.acuity >= 4) {
        newUnit = "ICU";
      } else if (patient.acuity === 1) {
        newUnit = "MEDSURG";
      } else {
        const units = ["ICU", "ER", "MEDSURG", "PEDS"];
        newUnit = units[Math.floor(Math.random() * units.length)];
      }
      
      if (newUnit !== patient.unit) {
        return { ...patient, unit: newUnit };
      }
    }
    return patient;
  });

  // 5. Dynamic staff unit reassignment based on workload
  const updatedStaff = reassignStaffToUnits(patients);
  
  // 6. Regenerate assignments with new patient pool and updated staff
  const assignments = assignPatientsToNurses(patients, updatedStaff);

  // 7. Check if rebalancing is needed and apply suggestions
  const suggestions = generateRebalancingSuggestions(assignments);
  
  // 8. Auto-apply suggestions (more aggressive as convergence improves)
  // Apply more suggestions and use lower threshold as ticks increase
  const suggestionsToApply = Math.ceil(1 + convergenceFactor * 2); // 1-3 suggestions
  const workloadThreshold = 3 - convergenceFactor * 2; // 3 → 1 as convergence improves
  
  const prioritySuggestions = suggestions.slice(0, suggestionsToApply);
  
  let rebalancedAssignments = assignments;
  for (const suggestion of prioritySuggestions) {
    if (Math.abs(suggestion.expectedFromWorkload - suggestion.expectedToWorkload) > workloadThreshold) {
      // Apply the suggestion by moving the patient
      rebalancedAssignments = applyRebalancingSuggestion(
        rebalancedAssignments,
        suggestion.fromNurseId,
        suggestion.toNurseId,
        suggestion.patientId
      );
    }
  }

  // Track workload history
  const workloadSnapshot: WorkloadSnapshot = {
    tick: simulationState.tick + 1,
    nurseWorkloads: {},
  };
  
  for (const assignment of rebalancedAssignments) {
    const utilization = assignment.maxWorkload > 0 
      ? assignment.workload / assignment.maxWorkload 
      : 0;
    workloadSnapshot.nurseWorkloads[assignment.nurseId] = {
      utilization,
      nurseName: assignment.nurseName,
    };
  }
  
  const updatedHistory = [...simulationState.workloadHistory, workloadSnapshot];
  
  // Keep only last 50 ticks
  if (updatedHistory.length > 50) {
    updatedHistory.shift();
  }

  // Update simulation state
  simulationState = {
    patients,
    assignments: rebalancedAssignments,
    lastUpdate: new Date(),
    tick: simulationState.tick + 1,
    isRunning: true,
    workloadHistory: updatedHistory,
  };

  return simulationState;
}

/**
 * Apply a rebalancing suggestion to assignments
 */
function applyRebalancingSuggestion(
  assignments: Assignment[],
  fromNurseId: string,
  toNurseId: string,
  patientId: string
): Assignment[] {
  return assignments.map(assignment => {
    // Remove patient from source nurse
    if (assignment.nurseId === fromNurseId) {
      const updatedPatients = assignment.patients.filter(p => p.id !== patientId);
      const updatedWorkload = updatedPatients.reduce((sum, p) => sum + p.acuity, 0);
      return {
        ...assignment,
        patients: updatedPatients,
        workload: updatedWorkload
      };
    }
    
    // Add patient to target nurse
    if (assignment.nurseId === toNurseId) {
      const patient = assignments
        .find(a => a.nurseId === fromNurseId)
        ?.patients.find(p => p.id === patientId);
      
      if (patient) {
        const updatedPatients = [...assignment.patients, patient];
        const updatedWorkload = updatedPatients.reduce((sum, p) => sum + p.acuity, 0);
        return {
          ...assignment,
          patients: updatedPatients,
          workload: updatedWorkload
        };
      }
    }
    
    return assignment;
  });
}

/**
 * Get current simulation state
 */
export function getSimulationState(): SimulationState {
  return simulationState;
}

/**
 * Start simulation
 */
export function startSimulation(): SimulationState {
  if (!simulationState.isRunning) {
    simulationState.isRunning = true;
  }
  return simulationState;
}

/**
 * Stop simulation
 */
export function stopSimulation(): SimulationState {
  simulationState.isRunning = false;
  return simulationState;
}

/**
 * Reset simulation to initial state
 */
export function resetSimulation(initialPatientCount: number = 30): SimulationState {
  return initializeSimulation(initialPatientCount);
}

/**
 * Calculate balance metric based on patient-to-nurse ratios
 * IDEAL: 1:1-2 (1-2 patients per nurse)
 * SUFFICIENT: 1:3-4 (3-4 patients per nurse)  
 * INADEQUATE: 1:5+ (5+ patients per nurse)
 */
export function calculateBalanceMetric(assignments: Assignment[]): {
  metric: 'IDEAL' | 'SUFFICIENT' | 'INADEQUATE';
  standardDeviation: number;
  averagePatientCount: number;
  maxPatientCount: number;
} {
  if (assignments.length === 0) {
    return { metric: 'IDEAL', standardDeviation: 0, averagePatientCount: 0, maxPatientCount: 0 };
  }

  // Calculate patient count for each nurse
  const patientCounts = assignments.map(a => a.patients.length);

  // Calculate mean patient count
  const mean = patientCounts.reduce((sum, count) => sum + count, 0) / patientCounts.length;

  // Calculate standard deviation of patient counts
  const squaredDiffs = patientCounts.map(count => Math.pow(count - mean, 2));
  const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / patientCounts.length;
  const stdDev = Math.sqrt(variance);

  // Find max patient count (worst case)
  const maxCount = Math.max(...patientCounts);

  // Determine metric based on max patient count and distribution
  let metric: 'IDEAL' | 'SUFFICIENT' | 'INADEQUATE';
  
  if (maxCount <= 2 && stdDev <= 1) {
    metric = 'IDEAL'; // All nurses have 1-2 patients, well balanced
  } else if (maxCount <= 4 && stdDev <= 1.5) {
    metric = 'SUFFICIENT'; // Most nurses have 3-4 patients, reasonably balanced
  } else {
    metric = 'INADEQUATE'; // Some nurses have 5+ patients or severe imbalance
  }

  return {
    metric,
    standardDeviation: stdDev,
    averagePatientCount: mean,
    maxPatientCount: maxCount,
  };
}

/**
 * Get simulation statistics
 */
export function getSimulationStats(): {
  totalPatients: number;
  patientsByUnit: Record<string, number>;
  averageAcuity: number;
  overloadedStaff: number;
  totalStaff: number;
  tick: number;
} {
  const { patients, assignments, tick } = simulationState;
  
  const patientsByUnit = patients.reduce((acc, p) => {
    acc[p.unit] = (acc[p.unit] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const averageAcuity = patients.length > 0
    ? patients.reduce((sum, p) => sum + p.acuity, 0) / patients.length
    : 0;

  const overloadedStaff = assignments.filter(
    a => a.workload > a.maxWorkload * 0.8
  ).length;

  return {
    totalPatients: patients.length,
    patientsByUnit,
    averageAcuity: Math.round(averageAcuity * 10) / 10,
    overloadedStaff,
    totalStaff: assignments.length,
    tick
  };
}
