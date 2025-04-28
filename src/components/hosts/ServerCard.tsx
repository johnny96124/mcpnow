
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { type ServerInstance, type ConnectionStatus } from "@/data/mockData";
import { AlertCircle, Info, MoreHorizontal, Play, Server, FileText, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ServerCardProps {
  server: ServerInstance;
  hostConnected: boolean;
  onRemoveServer: (serverId: string) => void;
  onViewDetails: (serverId: string) => void;
}

export function ServerCard({
  server,
  hostConnected,
  onRemoveServer,
  onViewDetails
}: ServerCardProps) {
  const [status, setStatus] = useState<ConnectionStatus>(
    hostConnected ? (server.status === "running" ? "connected" : "disconnected") : "disconnected"
  );
  const [isRunning, setIsRunning] = useState(server.status === "running");
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const { toast } = useToast();

  const handleToggleServer = () => {
    if (!hostConnected) return;
    
    if (!isRunning) {
      // Start server
      setStatus("connected" as ConnectionStatus);
      
      // Simulate server startup
      setTimeout(() => {
        // 80% chance of successful connection
        const success = Math.random() > 0.2;
        
        if (success) {
          setStatus("connected" as ConnectionStatus);
          setIsRunning(true);
          toast({
            title: "Server started",
            description: `${server.name} is now running.`
          });
        } else {
          setStatus("disconnected" as ConnectionStatus);
          setIsRunning(false);
          toast({
            title: "Failed to start server",
            description: `Could not start ${server.name}. Check configuration.`,
            variant: "destructive"
          });
        }
      }, 1500);
    } else {
      // Stop server
      setStatus("disconnected" as ConnectionStatus);
      setIsRunning(false);
      toast({
        title: "Server stopped",
        description: `${server.name} has been stopped.`
      });
    }
  };
  
  const getStatusColor = () => {
    switch (status) {
      case "connected":
        return "bg-green-500";
      case "disconnected":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "connected":
        return "Connected";
      case "disconnected":
        return "Disconnected";
      default:
        return "Disconnected";
    }
  };

  const mockLogs = [
    { time: "10:25:32", level: "INFO", message: "Server started successfully" },
    { time: "10:25:33", level: "INFO", message: "Listening on port 8080" },
    { time: "10:26:01", level: "DEBUG", message: "Connection received from 192.168.1.5" },
    { time: "10:26:02", level: "INFO", message: "User authenticated: admin" },
    { time: "10:26:45", level: "WARN", message: "High memory usage detected: 85%" },
    { time: "10:27:12", level: "ERROR", message: "Failed to connect to database" },
    { time: "10:27:15", level: "INFO", message: "Retrying database connection..." },
    { time: "10:27:18", level: "INFO", message: "Database connection established" }
  ];

  return (
    <>
      <Card className={`overflow-hidden ${status === "disconnected" ? "border-red-200" : ""}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Server className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{server.name}</h3>
                  {status === "disconnected" && (
                    <Badge variant="destructive" className="flex gap-1 items-center cursor-pointer" onClick={() => setIsDebugOpen(true)}>
                      <AlertCircle className="h-3 w-3" />
                      Error
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className={`h-2 w-2 rounded-full ${getStatusColor()}`} />
                  <span>{getStatusText()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch 
                checked={isRunning} 
                onCheckedChange={handleToggleServer} 
                disabled={!hostConnected || status === "disconnected"} 
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => setIsDebugOpen(true)}>
                      <AlertCircle className="h-4 w-4 mr-2" />
                      View Debug Tools
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsLogsOpen(true)}>
                      <FileText className="h-4 w-4 mr-2" />
                      View Logs
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onViewDetails(server.id)}>
                      <Info className="h-4 w-4 mr-2" />
                      Server Details
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive" 
                      onClick={() => onRemoveServer(server.id)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove from Profile
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {status === "disconnected" && (
            <div className="mt-3 text-sm p-2 rounded bg-red-50 text-red-700 border border-red-100">
              <p className="font-medium">Connection failed</p>
              <p className="mt-1">Check server configuration and host connectivity.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={isDebugOpen} onOpenChange={setIsDebugOpen}>
        <SheetContent className="w-[500px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Debug Tools: {server.name}</SheetTitle>
            <SheetDescription>
              Troubleshoot and inspect server activity
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Server Information</h3>
              <div className="rounded-md border bg-muted/40 p-3">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-muted-foreground">Status</div>
                  <div className="col-span-2 flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${getStatusColor()}`} />
                    <span>{getStatusText()}</span>
                  </div>
                  
                  <div className="text-muted-foreground">Connection</div>
                  <div className="col-span-2">{server.connectionDetails || "http://localhost:8008/mcp"}</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Server Controls</h3>
              <div className="flex gap-3">
                <Button 
                  variant={isRunning ? "outline" : "default"} 
                  size="sm" 
                  className="flex-1"
                  disabled={!hostConnected || status === "connected"}
                  onClick={() => {
                    if (!isRunning) {
                      handleToggleServer();
                    }
                  }}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </Button>
                <Button 
                  variant={!isRunning ? "outline" : "default"} 
                  size="sm" 
                  className="flex-1"
                  disabled={!hostConnected || !isRunning || status === "disconnected"}
                  onClick={() => {
                    if (isRunning) {
                      handleToggleServer();
                    }
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Server Logs</h3>
              <div className="h-[300px] overflow-auto rounded-md border bg-muted/40 p-3 font-mono text-xs">
                {status === "disconnected" ? (
                  <div className="text-red-500">
                    <p>[ERROR] Failed to connect to server at {server.connectionDetails || "http://localhost:8008/mcp"}</p>
                    <p>[ERROR] Connection timeout after 5000ms</p>
                    <p>[INFO] Possible causes:</p>
                    <p>[INFO] - Server is not running</p>
                    <p>[INFO] - Network connectivity issues</p>
                    <p>[INFO] - Incorrect server configuration</p>
                  </div>
                ) : (
                  mockLogs.map((log, i) => (
                    <div 
                      key={i} 
                      className={`${
                        log.level === "ERROR" ? "text-red-500" : 
                        log.level === "WARN" ? "text-amber-500" : 
                        log.level === "DEBUG" ? "text-blue-500" : ""
                      }`}
                    >
                      [{log.time}] [{log.level}] {log.message}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={isLogsOpen} onOpenChange={setIsLogsOpen}>
        <SheetContent className="w-[500px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Server Logs: {server.name}</SheetTitle>
            <SheetDescription>
              View detailed server activity logs
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <div className="h-[500px] overflow-auto rounded-md border bg-muted/40 p-3 font-mono text-xs">
              {mockLogs.map((log, i) => (
                <div 
                  key={i} 
                  className={`${
                    log.level === "ERROR" ? "text-red-500" : 
                    log.level === "WARN" ? "text-amber-500" : 
                    log.level === "DEBUG" ? "text-blue-500" : ""
                  }`}
                >
                  [{log.time}] [{log.level}] {log.message}
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
