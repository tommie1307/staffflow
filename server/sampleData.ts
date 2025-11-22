/**
 * Static staff dataset with qualifications and capabilities
 * This data remains constant day-to-day
 */
export interface StaffMember {
  id: string;
  name: string;
  qualifications: string[]; // Units they're qualified for (at least 2)
  maxPatients: number;
  maxWorkload: number;
  unit: string; // Primary assignment
  shift: {
    shiftType: "morning" | "afternoon" | "night";
    startTime: string;
    endTime: string;
    breaks: Array<{
      type: string;
      startTime: string;
      endTime: string;
      duration: number;
    }>;
    hoursWorked: number;
  };
}

export interface Patient {
  id: string;
  name: string;
  acuity: number; // 1-5, higher = more critical
  condition: string;
  requiredSkills: string[]; // Units/specialties needed
  assignedNurseId?: string;
  unit: string;
}

export const STATIC_STAFF: StaffMember[] = [
  {
    id: "nurse-001",
    name: "Sarah Johnson",
    qualifications: ["ICU", "ER"],
    maxPatients: 3,
    maxWorkload: 8,
    unit: "ICU",
    shift: {
      shiftType: "morning",
      startTime: "06:00",
      endTime: "14:00",
      breaks: [
        { type: "lunch", startTime: "10:00", endTime: "10:30", duration: 30 },
        { type: "short", startTime: "08:00", endTime: "08:15", duration: 15 },
        { type: "short", startTime: "12:00", endTime: "12:15", duration: 15 }
      ],
      hoursWorked: 8
    }
  },
  {
    id: "nurse-002",
    name: "Michael Chen",
    qualifications: ["ICU", "MEDSURG"],
    maxPatients: 4,
    maxWorkload: 9,
    unit: "ICU",
    shift: {
      shiftType: "afternoon",
      startTime: "14:00",
      endTime: "22:00",
      breaks: [
        { type: "lunch", startTime: "18:00", endTime: "18:30", duration: 30 },
        { type: "short", startTime: "16:00", endTime: "16:15", duration: 15 },
        { type: "short", startTime: "20:00", endTime: "20:15", duration: 15 }
      ],
      hoursWorked: 8
    }
  },
  {
    id: "nurse-003",
    name: "Emma Rodriguez",
    qualifications: ["ER", "MEDSURG"],
    maxPatients: 5,
    maxWorkload: 10,
    unit: "ER",
    shift: {
      shiftType: "morning",
      startTime: "06:00",
      endTime: "14:00",
      breaks: [
        { type: "lunch", startTime: "10:00", endTime: "10:30", duration: 30 },
        { type: "short", startTime: "08:00", endTime: "08:15", duration: 15 },
        { type: "short", startTime: "12:00", endTime: "12:15", duration: 15 }
      ],
      hoursWorked: 8
    }
  },
  {
    id: "nurse-004",
    name: "James Wilson",
    qualifications: ["ER", "ICU"],
    maxPatients: 4,
    maxWorkload: 8,
    unit: "ER",
    shift: {
      shiftType: "night",
      startTime: "22:00",
      endTime: "06:00",
      breaks: [
        { type: "lunch", startTime: "02:00", endTime: "02:30", duration: 30 },
        { type: "short", startTime: "00:00", endTime: "00:15", duration: 15 },
        { type: "short", startTime: "04:00", endTime: "04:15", duration: 15 }
      ],
      hoursWorked: 8
    }
  },
  {
    id: "nurse-005",
    name: "Lisa Thompson",
    qualifications: ["MEDSURG", "PEDS"],
    maxPatients: 4,
    maxWorkload: 8,
    unit: "MEDSURG",
    shift: {
      shiftType: "afternoon",
      startTime: "14:00",
      endTime: "22:00",
      breaks: [
        { type: "lunch", startTime: "18:00", endTime: "18:30", duration: 30 },
        { type: "short", startTime: "16:00", endTime: "16:15", duration: 15 },
        { type: "short", startTime: "20:00", endTime: "20:15", duration: 15 }
      ],
      hoursWorked: 8
    }
  },
  {
    id: "nurse-006",
    name: "David Martinez",
    qualifications: ["PEDS", "MEDSURG"],
    maxPatients: 3,
    maxWorkload: 7,
    unit: "PEDS",
    shift: {
      shiftType: "morning",
      startTime: "06:00",
      endTime: "14:00",
      breaks: [
        { type: "lunch", startTime: "10:00", endTime: "10:30", duration: 30 },
        { type: "short", startTime: "08:00", endTime: "08:15", duration: 15 },
        { type: "short", startTime: "12:00", endTime: "12:15", duration: 15 }
      ],
      hoursWorked: 8
    }
  },
  {
    id: "nurse-007",
    name: "Amanda Lee",
    qualifications: ["ICU", "ER", "MEDSURG"],
    maxPatients: 4,
    maxWorkload: 9,
    unit: "ICU",
    shift: {
      shiftType: "night",
      startTime: "22:00",
      endTime: "06:00",
      breaks: [
        { type: "lunch", startTime: "02:00", endTime: "02:30", duration: 30 },
        { type: "short", startTime: "00:00", endTime: "00:15", duration: 15 },
        { type: "short", startTime: "04:00", endTime: "04:15", duration: 15 }
      ],
      hoursWorked: 8
    }
  },
  {
    id: "nurse-008",
    name: "Robert Garcia",
    qualifications: ["MEDSURG", "ER"],
    maxPatients: 5,
    maxWorkload: 10,
    unit: "MEDSURG",
    shift: {
      shiftType: "morning",
      startTime: "06:00",
      endTime: "14:00",
      breaks: [
        { type: "lunch", startTime: "10:00", endTime: "10:30", duration: 30 },
        { type: "short", startTime: "08:00", endTime: "08:15", duration: 15 },
        { type: "short", startTime: "12:00", endTime: "12:15", duration: 15 }
      ],
      hoursWorked: 8
    }
  },
  {
    id: "nurse-009",
    name: "Jennifer Brown",
    qualifications: ["PEDS", "MEDSURG"],
    maxPatients: 4,
    maxWorkload: 8,
    unit: "PEDS",
    shift: {
      shiftType: "afternoon",
      startTime: "14:00",
      endTime: "22:00",
      breaks: [
        { type: "lunch", startTime: "18:00", endTime: "18:30", duration: 30 },
        { type: "short", startTime: "16:00", endTime: "16:15", duration: 15 },
        { type: "short", startTime: "20:00", endTime: "20:15", duration: 15 }
      ],
      hoursWorked: 8
    }
  },
  {
    id: "nurse-010",
    name: "Christopher Davis",
    qualifications: ["ER", "ICU"],
    maxPatients: 3,
    maxWorkload: 8,
    unit: "ER",
    shift: {
      shiftType: "afternoon",
      startTime: "14:00",
      endTime: "22:00",
      breaks: [
        { type: "lunch", startTime: "18:00", endTime: "18:30", duration: 30 },
        { type: "short", startTime: "16:00", endTime: "16:15", duration: 15 },
        { type: "short", startTime: "20:00", endTime: "20:15", duration: 15 }
      ],
      hoursWorked: 8
    }
  }
];

const PATIENT_FIRST_NAMES = [
  "John", "Mary", "Robert", "Patricia", "Michael", "Jennifer", "William", "Linda",
  "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah",
  "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa", "Matthew", "Betty",
  "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley", "Steven", "Kimberly"
];

const PATIENT_LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
  "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"
];

const CONDITIONS = [
  "Stable",
  "Critical",
  "Recovering",
  "Post-Op",
  "Admitted",
  "Observation",
  "Emergency"
];

const UNITS = ["ICU", "ER", "MEDSURG", "PEDS"];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(array: T[]): T {
  return array[randomInt(0, array.length - 1)];
}

function generatePatientName(): string {
  return `${randomItem(PATIENT_FIRST_NAMES)} ${randomItem(PATIENT_LAST_NAMES)}`;
}

/**
 * Generate dynamic patient data
 * Each call creates a new set of patients with random acuity, conditions, and assignments
 */
export function generateDynamicPatients(count: number = 15): Patient[] {
  const patients: Patient[] = [];
  
  for (let i = 0; i < count; i++) {
    const unit = randomItem(UNITS);
    const acuity = randomInt(1, 5);
    
    patients.push({
      id: `patient-${Date.now()}-${i}`,
      name: generatePatientName(),
      acuity,
      condition: randomItem(CONDITIONS),
      requiredSkills: [unit],
      unit,
      assignedNurseId: undefined // Will be assigned by the system
    });
  }
  
  return patients;
}

/**
 * Get all staff members (static)
 */
export function getStaffMembers(): StaffMember[] {
  return JSON.parse(JSON.stringify(STATIC_STAFF)); // Deep copy to prevent mutations
}

/**
 * Get a specific staff member by ID
 */
export function getStaffById(id: string): StaffMember | undefined {
  return STATIC_STAFF.find(staff => staff.id === id);
}

/**
 * Get staff members qualified for a specific unit
 */
export function getStaffBySkill(skill: string): StaffMember[] {
  return STATIC_STAFF.filter(staff => staff.qualifications.includes(skill));
}
