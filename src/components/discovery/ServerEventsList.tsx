
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronUp, AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ServerEvent, EventCategory, EventType } from "@/types/events";

const CATEGORY_COLORS: Record<EventCategory, { bg: string; text: string; border: string }> = {
  Tools: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" },
  Resources: { bg: "bg-green-100", text: "text-green-800", border: "border-green-200" },
  Prompts: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200" },
  Ping: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200" },
  Sampling: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200" },
  Roots: { bg: "bg-red-100", text: "text-red-800", border: "border-red-200" }
};

const EVENT_TYPE_COLORS: Record<EventType, { bg: string; text: string; border: string }> = {
  request: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200" },
  response: { bg: "bg-green-50", text: "text-green-800", border: "border-green-200" },
  error: { bg: "bg-red-50", text: "text-red-800", border: "border-red-200" },
  notification: { bg: "bg-yellow-50", text: "text-yellow-800", border: "border-yellow-200" }
};

interface ServerEventsListProps {
  events: ServerEvent[];
  instanceName?: string;
}

export function ServerEventsList({ events, instanceName }: ServerEventsListProps) {
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});
  
  const toggleEventExpansion = (eventId: string) => {
    setExpandedEvents(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };
  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: format(date, "MMM dd, yyyy"),
      time: format(date, "HH:mm:ss")
    };
  };
  
  const formatMethodDetails = (method: string, params: any) => {
    if (!method) return '';
    let details = '';
    if (method === 'tools/call' && params?.name) {
      details = params.name;
      if (params.arguments) {
        details += ` (${Object.values(params.arguments).join(', ')})`;
      }
    }
    return details;
  };
  
  if (events.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800">
            <Clock className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </div>
        </div>
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">No events recorded</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Events will appear here when communication occurs with this instance.
        </p>
      </div>
    );
  }
  
  return (
    <ScrollArea className="h-[500px] pr-4">
      <div className="space-y-2">
        {events.map((event) => {
          const { date, time } = formatTimestamp(event.timestamp);
          const methodDetails = formatMethodDetails(event.method || '', event.params);
          
          return (
            <div 
              key={event.id} 
              className={cn(
                "border rounded-md overflow-hidden transition-all",
                event.isError 
                  ? "border-red-400 dark:border-red-800 bg-red-50 dark:bg-red-900/20" 
                  : "border-gray-200 dark:border-gray-800"
              )}
            >
              <div 
                className={cn(
                  "flex items-center justify-between px-3 py-2 text-xs font-mono cursor-pointer",
                  event.isError 
                    ? "bg-red-100 dark:bg-red-900/30" 
                    : "bg-gray-50 dark:bg-gray-800/50"
                )}
                onClick={() => toggleEventExpansion(event.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex flex-col items-start text-gray-800 dark:text-gray-200">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">{date}</span>
                    <span className="font-semibold">{time}</span>
                  </div>

                  {event.category && (
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[10px] py-0 h-5",
                        CATEGORY_COLORS[event.category].bg,
                        CATEGORY_COLORS[event.category].text,
                        CATEGORY_COLORS[event.category].border
                      )}
                    >
                      {event.category}
                    </Badge>
                  )}

                  {event.isError && (
                    <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                  )}

                  {event.method && (
                    <div className="flex items-center gap-2 max-w-[300px]">
                      <span className="font-medium">{event.method}</span>
                      {methodDetails && (
                        <span className="text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                          {methodDetails}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {event.profileName && (
                    <Badge variant="outline" className="bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 border-purple-200">
                      {event.profileName}
                    </Badge>
                  )}
                  {event.hostName && (
                    <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border-amber-200">
                      {event.hostName}
                    </Badge>
                  )}
                  {expandedEvents[event.id] ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </div>
              
              {expandedEvents[event.id] && (
                <div className="flex flex-col">
                  {/* Always show the Request section for both normal and error events */}
                  <div 
                    className={cn(
                      "p-3 font-mono text-xs overflow-auto",
                      EVENT_TYPE_COLORS.request.bg,
                      EVENT_TYPE_COLORS.request.text, 
                      "border-t",
                      EVENT_TYPE_COLORS.request.border
                    )}
                  >
                    <div className="flex items-center mb-2">
                      <span className="font-bold mr-2 uppercase">Request</span>
                    </div>
                    <pre className="whitespace-pre-wrap break-all">
                      {JSON.stringify(event.params || event.content, null, 2)}
                    </pre>
                  </div>
                  
                  {/* Show Response or Error section based on event type */}
                  <div 
                    className={cn(
                      "p-3 font-mono text-xs overflow-auto",
                      event.isError 
                        ? EVENT_TYPE_COLORS.error.bg 
                        : EVENT_TYPE_COLORS.response.bg,
                      event.isError 
                        ? EVENT_TYPE_COLORS.error.text 
                        : EVENT_TYPE_COLORS.response.text,
                      "border-t",
                      event.isError 
                        ? EVENT_TYPE_COLORS.error.border 
                        : EVENT_TYPE_COLORS.response.border
                    )}
                  >
                    <div className="flex items-center mb-2">
                      <span className="font-bold mr-2 uppercase">
                        {event.isError ? 'Error' : 'Response'}
                      </span>
                    </div>
                    <pre className="whitespace-pre-wrap break-all">
                      {JSON.stringify(event.content, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
