import { X, Award, Briefcase, Clock } from "lucide-react";

interface StaffProfileModalProps {
  staff: {
    nurseId: string;
    nurseName: string;
    qualifications: string[];
    unit: string;
    maxPatients: number;
    maxWorkload: number;
    workload: number;
    patients: Array<{
      id: string;
      name: string;
      acuity: number;
    }>;
    shift?: {
      shiftType: string;
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
  };
  onClose: () => void;
}

const UNIT_NAMES: Record<string, string> = {
  ICU: "Intensive Care Unit",
  ER: "Emergency Room",
  MEDSURG: "Medical-Surgical",
  PEDS: "Pediatrics"
};

export default function StaffProfileModal({ staff, onClose }: StaffProfileModalProps) {
  const utilizationPercentage = Math.round((staff.workload / staff.maxWorkload) * 100);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="staff-profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose} aria-label="Close">
          <X size={24} />
        </button>

        <div className="profile-header">
          <div className="profile-avatar">
            {staff.nurseName.split(" ").map(n => n[0]).join("")}
          </div>
          <div className="profile-title">
            <h2>{staff.nurseName}</h2>
            <p className="profile-subtitle">Registered Nurse</p>
          </div>
        </div>

        <div className="profile-section">
          <div className="section-header">
            <Briefcase size={20} />
            <h3>Primary Assignment</h3>
          </div>
          <div className="section-content">
            <p className="primary-unit">{UNIT_NAMES[staff.unit] || staff.unit}</p>
          </div>
        </div>

        <div className="profile-section">
          <div className="section-header">
            <Award size={20} />
            <h3>Unit Qualifications</h3>
          </div>
          <div className="section-content">
            <div className="qualifications-grid">
              {staff.qualifications.map((qual, idx) => (
                <div key={idx} className="qualification-badge">
                  <span className="qualification-icon">✓</span>
                  <span className="qualification-name">{UNIT_NAMES[qual] || qual}</span>
                </div>
              ))}
            </div>
            <p className="qualifications-note">
              Qualified to work in {staff.qualifications.length} unit{staff.qualifications.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="profile-section">
          <div className="section-header">
            <Clock size={20} />
            <h3>Current Shift</h3>
          </div>
          <div className="section-content">
            {staff.shift ? (
              <>
                <div className="shift-info-row">
                  <span className="shift-label">Shift Type:</span>
                  <span className="shift-value">{staff.shift.shiftType.charAt(0).toUpperCase() + staff.shift.shiftType.slice(1)}</span>
                </div>
                <div className="shift-info-row">
                  <span className="shift-label">Hours:</span>
                  <span className="shift-value">{staff.shift.startTime} - {staff.shift.endTime}</span>
                </div>
              </>
            ) : (
              <p>No shift information available</p>
            )}
          </div>
        </div>

        <div className="profile-section">
          <div className="section-header">
            <h3>Workload Status</h3>
          </div>
          <div className="section-content">
            <div className="workload-stats">
              <div className="stat-item">
                <span className="stat-label">Current Patients</span>
                <span className="stat-value">{staff.patients.length} / {staff.maxPatients}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Workload</span>
                <span className="stat-value">{staff.workload} / {staff.maxWorkload}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Utilization</span>
                <span className="stat-value">{utilizationPercentage}%</span>
              </div>
            </div>
            <div className="workload-bar">
              <div 
                className={`workload-fill ${utilizationPercentage > 80 ? 'overloaded' : utilizationPercentage > 60 ? 'high' : 'safe'}`}
                style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {staff.patients.length > 0 && (
          <div className="profile-section">
            <div className="section-header">
              <h3>Assigned Patients ({staff.patients.length})</h3>
            </div>
            <div className="section-content">
              <div className="patients-list-profile">
                {staff.patients.map((patient) => (
                  <div key={patient.id} className="patient-item-profile">
                    <span className="patient-name-profile">{patient.name}</span>
                    <span className="patient-acuity-profile">Acuity: {patient.acuity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
