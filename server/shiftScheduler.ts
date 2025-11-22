// Shift types
export type ShiftType = "morning" | "afternoon" | "night";

// Break structure
export interface Break {
  type: "lunch" | "short";
  startTime: string;
  endTime: string;
  duration: number; // in minutes
}

// Shift schedule structure
export interface ShiftSchedule {
  shiftType: ShiftType;
  startTime: string;
  endTime: string;
  breaks: Break[];
  hoursWorked: number;
}

// Shift definitions (24-hour format HH:MM)
const SHIFT_DEFINITIONS = {
  morning: {
    startTime: "06:00",
    endTime: "14:00",
    hoursWorked: 8,
  },
  afternoon: {
    startTime: "14:00",
    endTime: "22:00",
    hoursWorked: 8,
  },
  night: {
    startTime: "22:00",
    endTime: "06:00",
    hoursWorked: 8,
  },
};

// Helper to add minutes to a time string
function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(":").map(Number);
  let totalMinutes = hours * 60 + mins + minutes;
  
  // Handle day wraparound
  if (totalMinutes >= 24 * 60) {
    totalMinutes -= 24 * 60;
  }
  
  const newHours = Math.floor(totalMinutes / 60);
  const newMins = totalMinutes % 60;
  
  return `${String(newHours).padStart(2, "0")}:${String(newMins).padStart(2, "0")}`;
}

// Generate break schedule for a shift
function generateBreakSchedule(shiftType: ShiftType): Break[] {
  const breaks: Break[] = [];
  const shiftDef = SHIFT_DEFINITIONS[shiftType];
  
  // Add lunch break (30 minutes) - typically in the middle of shift
  const lunchStart = addMinutesToTime(shiftDef.startTime, 240); // 4 hours into shift
  const lunchEnd = addMinutesToTime(lunchStart, 30);
  breaks.push({
    type: "lunch",
    startTime: lunchStart,
    endTime: lunchEnd,
    duration: 30,
  });
  
  // Add two 15-minute short breaks
  // First break: 2 hours into shift
  const break1Start = addMinutesToTime(shiftDef.startTime, 120);
  const break1End = addMinutesToTime(break1Start, 15);
  breaks.push({
    type: "short",
    startTime: break1Start,
    endTime: break1End,
    duration: 15,
  });
  
  // Second break: 6 hours into shift
  const break2Start = addMinutesToTime(shiftDef.startTime, 360);
  const break2End = addMinutesToTime(break2Start, 15);
  breaks.push({
    type: "short",
    startTime: break2Start,
    endTime: break2End,
    duration: 15,
  });
  
  return breaks;
}

// Generate random shift schedule for a nurse
export function generateShiftSchedule(): ShiftSchedule {
  const shiftTypes: ShiftType[] = ["morning", "afternoon", "night"];
  const randomShift = shiftTypes[Math.floor(Math.random() * shiftTypes.length)];
  const shiftDef = SHIFT_DEFINITIONS[randomShift];
  
  return {
    shiftType: randomShift,
    startTime: shiftDef.startTime,
    endTime: shiftDef.endTime,
    breaks: generateBreakSchedule(randomShift),
    hoursWorked: shiftDef.hoursWorked,
  };
}

// Format time for display
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

// Format shift schedule for display
export function formatShiftSchedule(schedule: ShiftSchedule): string {
  const start = formatTime(schedule.startTime);
  const end = formatTime(schedule.endTime);
  return `${start} - ${end}`;
}

// Check if nurse is currently on break
export function isOnBreak(schedule: ShiftSchedule, currentTime?: string): Break | null {
  const time = currentTime || new Date().toLocaleTimeString("en-US", { 
    hour12: false, 
    hour: "2-digit", 
    minute: "2-digit" 
  });
  
  for (const breakPeriod of schedule.breaks) {
    if (time >= breakPeriod.startTime && time < breakPeriod.endTime) {
      return breakPeriod;
    }
  }
  
  return null;
}

// Check if nurse is currently working
export function isCurrentlyWorking(schedule: ShiftSchedule, currentTime?: string): boolean {
  const time = currentTime || new Date().toLocaleTimeString("en-US", { 
    hour12: false, 
    hour: "2-digit", 
    minute: "2-digit" 
  });
  
  // For night shift, handle day wraparound
  if (schedule.shiftType === "night") {
    return time >= schedule.startTime || time < schedule.endTime;
  }
  
  return time >= schedule.startTime && time < schedule.endTime;
}
