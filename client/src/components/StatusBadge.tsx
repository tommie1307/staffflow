interface StatusBadgeProps {
  workload: number;
  maxWorkload: number;
}

export default function StatusBadge({ workload, maxWorkload }: StatusBadgeProps) {
  const workloadPercentage = (workload / maxWorkload) * 100;
  let status = 'safe';
  let statusText = 'Safe';

  if (workloadPercentage > 80) {
    status = 'danger';
    statusText = 'Overloaded';
  } else if (workloadPercentage > 60) {
    status = 'warning';
    statusText = 'High';
  }

  return (
    <span className={`status-badge ${status}`}>
      {statusText}
    </span>
  );
}
