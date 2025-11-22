import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import InfoModal from "@/components/InfoModal";
import UnitSelector from "@/components/UnitSelector";
import StaffProfileModal from "@/components/StaffProfileModal";
import RecommendationsPanel from "@/components/RecommendationsPanel";
import SimulationControls from "@/components/SimulationControls";
import WorkloadChart from "@/components/WorkloadChart";
import ShiftInfo from "@/components/ShiftInfo";
import { APP_LOGO } from "@/const";

interface Patient {
  id: string;
  name: string;
  acuity: number;
  assignedNurseId?: string;
  unit: string;
  condition?: string;
  requiredSkills?: string[];
}

interface Assignment {
  nurseId: string;
  nurseName: string;
  patients: Patient[];
  workload: number;
  maxWorkload: number;
  maxPatients: number;
  alert: string;
  unit: string;
  qualifications: string[];
  isOverloaded: boolean;
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
}

export default function Home() {
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedItem, setSelectedItem] = useState<
    ((Assignment & { type: "nurse" }) | (Patient & { type: "patient" })) | null
  >(null);
  const [selectedStaff, setSelectedStaff] = useState<Assignment | null>(null);

  const { data: assignments = [], isLoading, refetch } = trpc.staffflow.getAssignments.useQuery(
    { unit: selectedUnit || undefined },
    { 
      refetchOnWindowFocus: false 
    }
  );

  const { data: simulationState } = trpc.staffflow.getSimulationState.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const { data: balanceMetric } = trpc.staffflow.getBalanceMetric.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const handleUnitChange = (unit: string) => {
    setSelectedUnit(unit);
  };

  const handleRefresh = async () => {
    await refetch();
  };

  const closeModal = () => {
    setSelectedItem(null);
  };

  return (
    <div className="dashboard-container">
         <div className="dashboard-header">
        <img src={APP_LOGO} alt="Staffflow" className="dashboard-logo" />
        <h1>Staffflow Dashboard</h1>
      </div>
      
      <SimulationControls />
      
      <div className="header-controls">
          <UnitSelector selectedUnit={selectedUnit} onUnitChange={handleUnitChange} />
          <button className="refresh-button" onClick={handleRefresh} disabled={isLoading}>
            {isLoading ? "Loading..." : "Refresh Data"}
          </button>
        </div>

      {isLoading && <div className="loading-message">Loading assignments...</div>}

      <div className="assignments-grid">
        {assignments.map((assignment: Assignment) => (
          <div key={assignment.nurseId} className="assignment-card">
            <div className="card-header">
              <h3
                className="nurse-name"
                onClick={() => setSelectedStaff(assignment)}
              >
                {assignment.nurseName}
              </h3>
              <StatusBadge
                workload={assignment.workload}
                maxWorkload={assignment.maxWorkload}
              />
            </div>
            <div className="assignment-details">
              <p><strong>Unit:</strong> {assignment.unit}</p>
              <p><strong>Patients:</strong> {assignment.patients.length}</p>
              <p><strong>Workload:</strong> {assignment.workload} / {assignment.maxWorkload}</p>
              <p><strong>Qualifications:</strong> {assignment.qualifications.join(", ")}</p>
              {assignment.alert && (
                <div className="alert-badge">{assignment.alert}</div>
              )}
            </div>

            {assignment.shift && (
              <ShiftInfo shift={assignment.shift} />
            )}

            <div className="patients-list">
              <h4>Assigned Patients:</h4>
              {assignment.patients.map((patient: Patient) => (
                <div
                  key={patient.id}
                  className="patient-item"
                  onClick={() =>
                    setSelectedItem({
                      ...patient,
                      type: "patient",
                    } as Patient & { type: "patient" })
                  }
                >
                  <span className="patient-name">{patient.name}</span>
                  <span className="patient-acuity">(Acuity: {patient.acuity})</span>
                </div>
              ))}
              {assignment.patients.length === 0 && (
                <p className="no-patients">No patients assigned</p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <RecommendationsPanel />

      {/* Workload Visualization Chart */}
      <WorkloadChart
        workloadHistory={simulationState?.workloadHistory || []}
        balanceMetric={balanceMetric?.metric || "IDEAL"}
        standardDeviation={balanceMetric?.standardDeviation || 0}
        averagePatientCount={balanceMetric?.averagePatientCount || 0}
        maxPatientCount={balanceMetric?.maxPatientCount || 0}
      />

      {selectedItem && (
        <InfoModal
          item={selectedItem as any}
          onClose={closeModal}
        />
      )}

      {selectedStaff && (
        <StaffProfileModal
          staff={selectedStaff}
          onClose={() => setSelectedStaff(null)}
        />
      )}
    </div>
  );
}
