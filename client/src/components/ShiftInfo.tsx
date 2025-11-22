interface Break {
  type: string;
  startTime: string;
  endTime: string;
  duration: number;
}

interface ShiftSchedule {
  shiftType: string;
  startTime: string;
  endTime: string;
  breaks: Break[];
  hoursWorked: number;
}

interface ShiftInfoProps {
  shift?: ShiftSchedule;
}

// Format time from 24-hour to 12-hour format
function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${ampm}`;
}

// Capitalize shift type
function capitalizeShift(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

// Capitalize break type
function capitalizeBreakType(type: string): string {
  if (type === "short") return "Short Break";
  if (type === "lunch") return "Lunch Break";
  return type;
}

export default function ShiftInfo({ shift }: ShiftInfoProps) {
  if (!shift) {
    return null;
  }

  return (
    <div className="shift-info">
      <div className="shift-header">
        <div className="shift-type-badge">{capitalizeShift(shift.shiftType)}</div>
        <div className="shift-time">
          {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
        </div>
      </div>

      {shift.breaks && shift.breaks.length > 0 && (
        <div className="breaks-section">
          <h5>Breaks:</h5>
          <div className="breaks-list">
            {shift.breaks.map((breakItem, index) => (
              <div key={index} className="break-item">
                <span className="break-type">{capitalizeBreakType(breakItem.type)}</span>
                <span className="break-time">
                  {formatTime(breakItem.startTime)} - {formatTime(breakItem.endTime)}
                </span>
                <span className="break-duration">({breakItem.duration}m)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
