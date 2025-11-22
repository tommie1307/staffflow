import { STATIC_STAFF, type StaffMember, type Patient } from "./sampleData";

export interface Assignment {
  nurseId: string;
  nurseName: string;
  unit: string;
  qualifications: string[];
  patients: Patient[];
  workload: number;
  maxWorkload: number;
  maxPatients: number;
  isOverloaded: boolean;
  alert: string;
  shift: StaffMember["shift"];
}

export interface RebalancingSuggestion {
  fromNurseId: string;
  fromNurseName: string;
  toNurseId: string;
  toNurseName: string;
  patientId: string;
  patientName: string;
  reason: string;
  expectedFromWorkload: number;
  expectedToWorkload: number;
  skillMatch: boolean;
}

/**
 * Assign patients to nurses based on skills and current workload
 */
export function assignPatientsToNurses(
  patients: Patient[],
  staff: StaffMember[] = STATIC_STAFF
): Assignment[] {
  // Create a copy of staff with tracking
  const staffWithWorkload = staff.map(nurse => ({
    ...nurse,
    assignedPatients: [] as Patient[],
    currentWorkload: 0
  }));

  // Sort patients by acuity (highest first) to assign critical patients first
  const sortedPatients = [...patients].sort((a, b) => b.acuity - a.acuity);

  // Assign each patient to the best available nurse
  for (const patient of sortedPatients) {
    // Find nurses qualified for this patient's unit
    const qualifiedNurses = staffWithWorkload.filter(
      nurse =>
        nurse.qualifications.includes(patient.unit) &&
        nurse.currentWorkload < nurse.maxWorkload &&
        nurse.assignedPatients.length < nurse.maxPatients
    );

    if (qualifiedNurses.length > 0) {
      // Pick the nurse with the lowest current workload
      const bestNurse = qualifiedNurses.reduce((prev, current) =>
        prev.currentWorkload < current.currentWorkload ? prev : current
      );

      bestNurse.assignedPatients.push(patient);
      bestNurse.currentWorkload += patient.acuity;
      patient.assignedNurseId = bestNurse.id;
    } else {
      // If no qualified nurse available, assign to any available nurse
      const availableNurses = staffWithWorkload.filter(
        nurse =>
          nurse.currentWorkload < nurse.maxWorkload &&
          nurse.assignedPatients.length < nurse.maxPatients
      );

      if (availableNurses.length > 0) {
        const bestNurse = availableNurses.reduce((prev, current) =>
          prev.currentWorkload < current.currentWorkload ? prev : current
        );

        bestNurse.assignedPatients.push(patient);
        bestNurse.currentWorkload += patient.acuity;
        patient.assignedNurseId = bestNurse.id;
      }
    }
  }

  // Create assignments array
  const assignments: Assignment[] = staffWithWorkload.map(nurse => {
    const isOverloaded =
      nurse.currentWorkload > nurse.maxWorkload ||
      nurse.assignedPatients.length > nurse.maxPatients;

    let alert = "";
    if (nurse.assignedPatients.length > nurse.maxPatients) {
      alert = "Too many patients!";
    } else if (nurse.currentWorkload > nurse.maxWorkload) {
      alert = "Workload too high!";
    }

    return {
      nurseId: nurse.id,
      nurseName: nurse.name,
      unit: nurse.unit,
      qualifications: nurse.qualifications,
      patients: nurse.assignedPatients,
      workload: nurse.currentWorkload,
      maxWorkload: nurse.maxWorkload,
      maxPatients: nurse.maxPatients,
      isOverloaded,
      alert,
      shift: nurse.shift
    };
  });

  return assignments;
}

/**
 * Generate rebalancing suggestions based on skills and workload
 */
export function generateRebalancingSuggestions(
  assignments: Assignment[]
): RebalancingSuggestion[] {
  const suggestions: RebalancingSuggestion[] = [];

  // Find overloaded nurses
  const overloadedAssignments = assignments.filter(a => a.isOverloaded);

  for (const overloaded of overloadedAssignments) {
    // Find underutilized nurses who can help
    const underutilizedNurses = assignments.filter(
      a =>
        a.nurseId !== overloaded.nurseId &&
        a.workload < a.maxWorkload * 0.6 && // Less than 60% utilized
        a.patients.length < a.maxPatients
    );

    // For each patient of the overloaded nurse, find the best candidate to take them
    for (const patient of overloaded.patients) {
      // Prioritize nurses with matching skills
      const skillMatchNurses = underutilizedNurses.filter(a =>
        a.qualifications.includes(patient.unit)
      );

      const targetNurse =
        skillMatchNurses.length > 0
          ? skillMatchNurses[0]
          : underutilizedNurses[0];

      if (targetNurse) {
        const expectedFromWorkload = overloaded.workload - patient.acuity;
        const expectedToWorkload = targetNurse.workload + patient.acuity;

        // Only suggest if it improves the situation
        if (
          expectedFromWorkload < overloaded.workload &&
          expectedToWorkload < targetNurse.maxWorkload
        ) {
          suggestions.push({
            fromNurseId: overloaded.nurseId,
            fromNurseName: overloaded.nurseName,
            toNurseId: targetNurse.nurseId,
            toNurseName: targetNurse.nurseName,
            patientId: patient.id,
            patientName: patient.name,
            reason: `Move ${patient.name} (acuity ${patient.acuity}) from ${overloaded.nurseName} to ${targetNurse.nurseName} to balance workload`,
            expectedFromWorkload,
            expectedToWorkload,
            skillMatch: targetNurse.qualifications.includes(patient.unit)
          });

          // Update the underutilized nurse's workload for next iteration
          targetNurse.workload += patient.acuity;
          targetNurse.patients.push(patient);
        }
      }
    }
  }

  return suggestions;
}

/**
 * Apply a rebalancing suggestion
 */
export function applySuggestion(
  assignments: Assignment[],
  suggestion: RebalancingSuggestion
): Assignment[] {
  const updated = assignments.map(a => {
    if (a.nurseId === suggestion.fromNurseId) {
      const patientToMove = a.patients.find(p => p.id === suggestion.patientId);
      if (patientToMove) {
        return {
          ...a,
          patients: a.patients.filter(p => p.id !== suggestion.patientId),
          workload: a.workload - patientToMove.acuity,
          isOverloaded:
            a.workload - patientToMove.acuity > a.maxWorkload ||
            a.patients.length - 1 > a.maxPatients,
          alert:
            a.workload - patientToMove.acuity > a.maxWorkload
              ? "Workload too high!"
              : a.patients.length - 1 > a.maxPatients
                ? "Too many patients!"
                : ""
        };
      }
    }

    if (a.nurseId === suggestion.toNurseId) {
      const patientToAdd = assignments
        .find(x => x.nurseId === suggestion.fromNurseId)
        ?.patients.find(p => p.id === suggestion.patientId);

      if (patientToAdd) {
        return {
          ...a,
          patients: [...a.patients, patientToAdd],
          workload: a.workload + patientToAdd.acuity,
          isOverloaded:
            a.workload + patientToAdd.acuity > a.maxWorkload ||
            a.patients.length + 1 > a.maxPatients,
          alert:
            a.workload + patientToAdd.acuity > a.maxWorkload
              ? "Workload too high!"
              : a.patients.length + 1 > a.maxPatients
                ? "Too many patients!"
                : ""
        };
      }
    }

    return a;
  });

  return updated;
}
