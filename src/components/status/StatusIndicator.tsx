
import { cn } from "@/lib/utils";

type StatusType = 'active' | 'warning' | 'error' | 'inactive';

interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  className?: string;
}

export function StatusIndicator({ 
  status, 
  label,
  className 
}: StatusIndicatorProps) {
  const statusClass = {
    'active': 'status-active',
    'warning': 'status-warning',
    'error': 'status-error',
    'inactive': 'status-inactive'
  }[status];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className={cn("status-dot", statusClass)}></span>
      {label && <span className="text-sm font-medium">{label}</span>}
    </div>
  );
}
