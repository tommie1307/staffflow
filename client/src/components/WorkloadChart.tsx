import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface WorkloadSnapshot {
  tick: number;
  nurseWorkloads: Record<string, { utilization: number; nurseName: string }>;
}

interface WorkloadChartProps {
  workloadHistory: WorkloadSnapshot[];
  balanceMetric: "IDEAL" | "SUFFICIENT" | "INADEQUATE";
  standardDeviation: number;
  averagePatientCount: number;
  maxPatientCount: number;
}

// Color palette for different nurses
const NURSE_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#6366f1", // indigo
  "#84cc16", // lime
];

export default function WorkloadChart({
  workloadHistory,
  balanceMetric,
  standardDeviation,
  averagePatientCount,
  maxPatientCount,
}: WorkloadChartProps) {
  // Transform data for Recharts format
  const chartData = useMemo(() => {
    if (workloadHistory.length === 0) return [];

    // Get all unique nurse IDs
    const nurseIds = new Set<string>();
    workloadHistory.forEach((snapshot) => {
      Object.keys(snapshot.nurseWorkloads).forEach((id) => nurseIds.add(id));
    });

    // Transform each tick into a data point
    return workloadHistory.map((snapshot) => {
      const dataPoint: any = { tick: snapshot.tick };
      
      nurseIds.forEach((nurseId) => {
        const workload = snapshot.nurseWorkloads[nurseId];
        if (workload) {
          dataPoint[nurseId] = (workload.utilization * 100).toFixed(1); // Convert to percentage
        } else {
          dataPoint[nurseId] = null;
        }
      });

      return dataPoint;
    });
  }, [workloadHistory]);

  // Get nurse names for legend
  const nurseNames = useMemo(() => {
    if (workloadHistory.length === 0) return {};
    
    const latestSnapshot = workloadHistory[workloadHistory.length - 1];
    const names: Record<string, string> = {};
    
    Object.entries(latestSnapshot.nurseWorkloads).forEach(([id, data]) => {
      names[id] = data.nurseName;
    });

    return names;
  }, [workloadHistory]);

  // Get metric color and description
  const getMetricInfo = () => {
    switch (balanceMetric) {
      case "IDEAL":
        return {
          color: "#22c55e",
          label: "IDEAL",
          description: "Workloads are converging - excellent balance",
        };
      case "SUFFICIENT":
        return {
          color: "#f59e0b",
          label: "SUFFICIENT",
          description: "Workloads are reasonably balanced",
        };
      case "INADEQUATE":
        return {
          color: "#ef4444",
          label: "INADEQUATE",
          description: "Workloads are diverging - rebalancing needed",
        };
    }
  };

  const metricInfo = getMetricInfo();

  if (chartData.length === 0) {
    return (
      <div className="workload-chart-container">
        <div className="chart-header">
          <h3>Workload Distribution Over Time</h3>
          <div className="balance-metric">
            <span className="metric-label">Balance Status:</span>
            <span className="metric-value" style={{ color: "#6b7280" }}>
              No Data
            </span>
          </div>
        </div>
        <div className="chart-empty">
          Start the simulation to see workload trends
        </div>
      </div>
    );
  }

  return (
    <div className="workload-chart-container">
      <div className="chart-header">
        <h3>Workload Distribution Over Time</h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="balance-metric cursor-help">
              <span className="metric-label">Balance Status:</span>
              <span
                className="metric-value"
                style={{ color: metricInfo.color, fontWeight: 700 }}
              >
                {metricInfo.label}
              </span>
              <span className="metric-description">{metricInfo.description}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold mb-1">Balance Status Metrics:</p>
            <p className="text-xs"><span className="text-green-400">●</span> IDEAL: Std Dev &lt; 0.1 (workloads converging)</p>
            <p className="text-xs"><span className="text-amber-400">●</span> SUFFICIENT: Std Dev 0.1-0.2 (reasonably balanced)</p>
            <p className="text-xs"><span className="text-red-400">●</span> INADEQUATE: Std Dev &gt; 0.2 (workloads diverging)</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="chart-stats">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="stat-item cursor-help">
              <span className="stat-label">Std Deviation:</span>
              <span className="stat-value">{standardDeviation.toFixed(3)}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Standard deviation of workload utilization across all nurses</p>
            <p className="text-xs mt-1">Lower values indicate better balance</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="stat-item cursor-help">
              <span className="stat-label">Avg Patients:</span>
              <span className="stat-value">{averagePatientCount.toFixed(1)}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Average number of patients per nurse</p>
            <p className="text-xs mt-1">IDEAL: 1-2 | SUFFICIENT: 3-4 | INADEQUATE: 5+</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="stat-item cursor-help">
              <span className="stat-label">Max Patients:</span>
              <span className="stat-value">{maxPatientCount}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Highest patient count for any single nurse</p>
            <p className="text-xs mt-1">Indicates worst-case workload</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="stat-item cursor-help">
              <span className="stat-label">Ticks Tracked:</span>
              <span className="stat-value">{workloadHistory.length}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Number of simulation ticks recorded in the chart</p>
            <p className="text-xs mt-1">Each tick = 15-20 minutes of hospital time</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="tick"
            label={{ value: "Simulation Tick", position: "insideBottom", offset: -5 }}
            stroke="#6b7280"
          />
          <YAxis
            label={{ value: "Workload Utilization (%)", angle: -90, position: "insideLeft" }}
            domain={[0, 100]}
            stroke="#6b7280"
          />
          <ChartTooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #e5e7eb",
              borderRadius: "0.5rem",
            }}
            formatter={(value: any) => [`${value}%`, ""]}
            labelFormatter={(tick: any) => `Tick ${tick}`}
          />
          <Legend
            wrapperStyle={{ paddingTop: "20px" }}
            formatter={(value) => nurseNames[value] || value}
          />
          
          {Object.keys(nurseNames).map((nurseId, index) => (
            <Line
              key={nurseId}
              type="monotone"
              dataKey={nurseId}
              stroke={NURSE_COLORS[index % NURSE_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
