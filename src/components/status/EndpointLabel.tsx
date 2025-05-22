
import { cn } from "@/lib/utils";
import type { ConnectionType, SubConnectionType } from "@/data/mockData";
import { Server } from "lucide-react";

interface EndpointLabelProps {
  type: ConnectionType | 'Custom';
  subType?: SubConnectionType;
  className?: string;
  isHosted?: boolean;
}

export function EndpointLabel({ type, subType, isHosted, className }: EndpointLabelProps) {
  let labelText = '';
  let typeClasses = '';
  
  switch(type) {
    case 'HTTP_SSE':
      labelText = subType ? `HTTP ${subType.toUpperCase()}` : 'HTTP SSE';
      typeClasses = "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900";
      break;
    case 'STDIO':
      labelText = subType ? `STDIO (${subType.toUpperCase()})` : 'STDIO';
      typeClasses = "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-900";
      break;
    case 'WS':
      labelText = 'WebSocket';
      typeClasses = "bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-900";
      break;
    case 'Custom':
      labelText = 'Custom';
      typeClasses = "bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
      break;
  }
  
  const baseClasses = "px-2 py-0.5 text-xs font-medium rounded-md inline-flex items-center gap-1";
  
  return (
    <span className={cn(baseClasses, typeClasses, className)}>
      {labelText}
      {isHosted && <Server className="h-3 w-3" />}
    </span>
  );
}
