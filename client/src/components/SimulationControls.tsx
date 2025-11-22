import { Play, Pause, RotateCcw, FastForward, Activity } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function SimulationControls() {
  const [autoRun, setAutoRun] = useState(false);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  const { data: stats } = trpc.staffflow.getSimulationStats.useQuery(undefined, {
    refetchInterval: autoRun ? 5000 : false
  });

  const { data: state } = trpc.staffflow.getSimulationState.useQuery();

  const initMutation = trpc.staffflow.initSimulation.useMutation();
  const runTickMutation = trpc.staffflow.runTick.useMutation();
  const startMutation = trpc.staffflow.startSimulation.useMutation();
  const stopMutation = trpc.staffflow.stopSimulation.useMutation();
  const resetMutation = trpc.staffflow.resetSimulation.useMutation();

  const utils = trpc.useUtils();

  const handleInit = async () => {
    await initMutation.mutateAsync();
    utils.staffflow.getSimulationState.invalidate();
    utils.staffflow.getSimulationStats.invalidate();
    utils.staffflow.getAssignments.invalidate();
  };

  const handleRunTick = async () => {
    try {
      await runTickMutation.mutateAsync();
      // Force immediate refetch of all data
      await Promise.all([
        utils.staffflow.getSimulationState.invalidate(),
        utils.staffflow.getSimulationStats.invalidate(),
        utils.staffflow.getAssignments.invalidate(),
        utils.staffflow.getBalanceMetric.invalidate()
      ]);
    } catch (error) {
      console.error("Error running tick:", error);
    }
  };

  const handleStart = async () => {
    await startMutation.mutateAsync();
    setAutoRun(true);
    utils.staffflow.getSimulationState.invalidate();
  };

  const handleStop = async () => {
    await stopMutation.mutateAsync();
    setAutoRun(false);
    utils.staffflow.getSimulationState.invalidate();
  };

  const handleReset = async () => {
    await resetMutation.mutateAsync();
    setAutoRun(false);
    utils.staffflow.getSimulationState.invalidate();
    utils.staffflow.getSimulationStats.invalidate();
    utils.staffflow.getAssignments.invalidate();
  };

  // Auto-run simulation ticks
  useEffect(() => {
    if (autoRun) {
      const id = setInterval(() => {
        handleRunTick();
      }, 5000); // Run every 5 seconds
      setIntervalId(id);
    } else {
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRun]);

  return (
    <div className="simulation-controls">
      <div className="simulation-header">
        <div className="simulation-title">
          <Activity size={20} />
          <h3>Simulation Controls</h3>
        </div>
        {state && (
          <div className="simulation-status">
            <span className={`status-indicator ${state.isRunning ? 'running' : 'stopped'}`} />
            <span className="status-text">{state.isRunning ? 'Running' : 'Stopped'}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="tick-count cursor-help">Tick: {stats?.tick || 0}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Each tick represents 15-20 minutes of real hospital time</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>

      <div className="simulation-stats">
        {stats && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="stat-card cursor-help">
                  <span className="stat-label">Total Patients</span>
                  <span className="stat-value">{stats.totalPatients}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total number of patients currently in the hospital across all units</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="stat-card cursor-help">
                  <span className="stat-label">Avg Acuity</span>
                  <span className="stat-value">{stats.averageAcuity.toFixed(1)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Average patient condition severity (1=Stable, 5=Critical)</p>
                <p className="text-xs mt-1">Higher acuity requires more nursing resources</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="stat-card cursor-help">
                  <span className="stat-label">Overloaded Staff</span>
                  <span className="stat-value overloaded">{stats.overloadedStaff} / {stats.totalStaff}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Number of nurses with workload exceeding 80% of maximum capacity</p>
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>

      <div className="simulation-buttons">
        {!state && (
          <button
            onClick={handleInit}
            disabled={initMutation.isPending}
            className="sim-button primary"
          >
            <Play size={16} />
            Initialize Simulation
          </button>
        )}

        {state && (
          <>
            {!autoRun ? (
              <button
                onClick={handleStart}
                disabled={startMutation.isPending}
                className="sim-button success"
              >
                <Play size={16} />
                Start Auto-Run
              </button>
            ) : (
              <button
                onClick={handleStop}
                disabled={stopMutation.isPending}
                className="sim-button warning"
              >
                <Pause size={16} />
                Stop Auto-Run
              </button>
            )}

            <button
              onClick={handleRunTick}
              disabled={runTickMutation.isPending || autoRun}
              className="sim-button secondary"
            >
              <FastForward size={16} />
              Run Single Tick
            </button>

            <button
              onClick={handleReset}
              disabled={resetMutation.isPending}
              className="sim-button danger"
            >
              <RotateCcw size={16} />
              Reset
            </button>
          </>
        )}
      </div>

      {stats && stats.totalPatients > 0 && (
        <div className="unit-breakdown">
          <h4>Patients by Unit</h4>
          <div className="unit-stats">
            {Object.entries(stats.patientsByUnit).map(([unit, count]) => (
              <div key={unit} className="unit-stat">
                <span className="unit-name">{unit}</span>
                <span className="unit-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
