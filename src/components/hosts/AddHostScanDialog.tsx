import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  Dialog,
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Scan, PlusCircle, Check, AlertCircle, X } from "lucide-react";
import { type Host, type ConnectionStatus } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

const hostSchema = z.object({
  name: z.string().min(1, { message: "Host name is required" }),
  configPath: z.string().min(1, { message: "Config path is required" }),
  icon: z.string().optional().default("💻"),
});

type HostFormValues = z.infer<typeof hostSchema>;

interface ScannedHost {
  id: string;
  name: string;
  icon: string;
  connectionStatus: ConnectionStatus;
  configStatus: "configured" | "misconfigured" | "unknown";
  selected?: boolean;
}

interface AddHostScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddHosts: (hosts: Host[]) => void;
}

export function AddHostScanDialog({
  open,
  onOpenChange,
  onAddHosts,
}: AddHostScanDialogProps) {
  const [activeTab, setActiveTab] = useState<string>("scan");
  const [scannedHosts, setScannedHosts] = useState<ScannedHost[]>([]);
  const [selectedHosts, setSelectedHosts] = useState<ScannedHost[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanComplete, setScanComplete] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const { toast } = useToast();

  const form = useForm<HostFormValues>({
    resolver: zodResolver(hostSchema),
    defaultValues: {
      name: "",
      configPath: "",
      icon: "💻",
    },
  });

  const resetState = () => {
    setScannedHosts([]);
    setSelectedHosts([]);
    setIsScanning(false);
    setScanComplete(false);
    setIsValidating(false);
    setActiveTab("scan");
    form.reset();
  };

  useEffect(() => {
    if (open) {
      handleScan();
    } else {
      resetState();
    }
  }, [open]);

  const handleHostSelect = (host: ScannedHost) => {
    const newSelected = selectedHosts.find(h => h.id === host.id)
      ? selectedHosts.filter(h => h.id !== host.id)
      : [...selectedHosts, host];
    setSelectedHosts(newSelected);
  };

  const handleRemoveSelected = (hostId: string) => {
    setSelectedHosts(selectedHosts.filter(host => host.id !== hostId));
  };

  const handleScan = () => {
    setIsScanning(true);
    setScanComplete(false);
    setScannedHosts([]);
    setSelectedHosts([]);
    
    // Simulate scanning process
    setTimeout(() => {
      const mockHosts: ScannedHost[] = [
        {
          id: `host-${Date.now()}-1`,
          name: "Local Development Host",
          icon: "💻",
          connectionStatus: "disconnected",
          configStatus: "unknown"
        },
        {
          id: `host-${Date.now()}-2`,
          name: "Remote Server Host",
          icon: "🖥️",
          connectionStatus: "disconnected",
          configStatus: "unknown"
        }
      ];
      
      // Randomly decide whether to find hosts or not for demo purposes
      const foundHosts = Math.random() > 0.3;
      if (foundHosts) {
        setScannedHosts(mockHosts);
      }
      
      setIsScanning(false);
      setScanComplete(true);
      
      if (foundHosts) {
        toast({
          title: "Hosts discovered",
          description: `Found ${mockHosts.length} hosts on your network.`
        });
      } else {
        toast({
          title: "No hosts found",
          description: "No hosts were discovered on your network.",
          variant: "destructive"
        });
      }
    }, 2000);
  };

  const handleManualSubmit = async (values: HostFormValues) => {
    setIsValidating(true);
    
    // Simulate path validation
    try {
      // Fake validation - reject paths that don't have .json extension
      await new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          if (!values.configPath.endsWith('.json')) {
            reject(new Error("Invalid config path. Path must point to a JSON file."));
          } else {
            resolve();
          }
        }, 1000);
      });
      
      const newHost: Host = {
        id: `host-${Date.now()}`,
        name: values.name,
        icon: values.icon || "💻",
        configPath: values.configPath,
        connectionStatus: "connected",
        configStatus: "configured"
      };
      
      onAddHosts([newHost]);
      onOpenChange(false);
      toast({
        title: "Host added successfully",
        description: `${values.name} has been configured and is ready to use.`
      });
    } catch (error: any) {
      toast({
        title: "Configuration failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleAddSelectedHosts = () => {
    if (selectedHosts.length === 0) {
      toast({
        title: "No hosts selected",
        description: "Please select at least one host to add.",
        variant: "destructive"
      });
      return;
    }

    const hostsToAdd: Host[] = selectedHosts.map(host => ({
      ...host,
      configPath: `/Users/user/.mcp/hosts/${host.name.toLowerCase().replace(/\s+/g, '-')}.json`,
      configStatus: "configured",
      connectionStatus: "connected"
    }));

    onAddHosts(hostsToAdd);
    onOpenChange(false);
    toast({
      title: "Hosts added successfully",
      description: `${hostsToAdd.length} hosts have been configured and are ready to use.`
    });
  };

  const iconOptions = [
    { value: "💻", label: "Laptop" },
    { value: "🖥️", label: "Desktop" },
    { value: "🌐", label: "Network" },
    { value: "☁️", label: "Cloud" },
    { value: "🔌", label: "Server" }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Hosts</DialogTitle>
          <DialogDescription>
            Discover hosts on your network or manually configure a host
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scan" className="flex items-center gap-2">
              <Scan className="h-4 w-4" />
              Scan for Hosts
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Add Host Manually
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="space-y-4">
            {!scanComplete && (
              <div className="flex justify-center py-2">
                <Button 
                  onClick={handleScan} 
                  disabled={isScanning}
                  className="w-full"
                >
                  {isScanning ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Scan className="h-4 w-4 mr-2" />
                      Scan Network
                    </>
                  )}
                </Button>
              </div>
            )}

            {isScanning && (
              <div className="space-y-3 py-2">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[150px]" />
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[180px]" />
                    <Skeleton className="h-3 w-[160px]" />
                  </div>
                </div>
              </div>
            )}

            {scanComplete && scannedHosts.length > 0 && (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {scannedHosts.map((host) => (
                    <Card 
                      key={host.id} 
                      className={`cursor-pointer ${
                        selectedHosts.some(h => h.id === host.id) 
                          ? "border-primary" 
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => handleHostSelect(host)}
                    >
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            <span className="text-xl">{host.icon}</span>
                          </div>
                          <div>
                            <p className="font-medium">{host.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Auto-discovered host
                            </p>
                          </div>
                        </div>
                        <Checkbox checked={selectedHosts.some(h => h.id === host.id)} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}

            {scanComplete && scannedHosts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No hosts found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  No hosts were discovered on your network. Try scanning again or add a host manually.
                </p>
                <div className="mt-4 flex gap-4">
                  <Button variant="outline" onClick={handleScan}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Scan Again
                  </Button>
                  <Button onClick={() => setActiveTab("manual")}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Manually
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="manual">
            <Form {...form}>
              <form className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Host Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter host name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="configPath"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Config Path</FormLabel>
                      <FormControl>
                        <Input placeholder="/path/to/config.json" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon</FormLabel>
                      <div className="grid grid-cols-5 gap-2">
                        {iconOptions.map(option => (
                          <Button
                            key={option.value}
                            type="button"
                            variant={field.value === option.value ? "default" : "outline"}
                            className="h-10"
                            onClick={() => form.setValue("icon", option.value)}
                          >
                            <span className="text-lg mr-1">{option.value}</span>
                            <span className="text-xs">{option.label}</span>
                          </Button>
                        ))}
                      </div>
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </TabsContent>
        </Tabs>

        {selectedHosts.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Selected Hosts ({selectedHosts.length})</h4>
            <div className="flex flex-wrap gap-2">
              {selectedHosts.map(host => (
                <Badge key={host.id} variant="secondary" className="pl-2">
                  {host.name}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 ml-1 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveSelected(host.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between sm:justify-end mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          {activeTab === "scan" ? (
            <Button
              disabled={selectedHosts.length === 0}
              onClick={handleAddSelectedHosts}
            >
              <Check className="h-4 w-4 mr-2" />
              Add Selected Hosts
            </Button>
          ) : (
            <Button 
              disabled={!form.formState.isValid || isValidating} 
              onClick={form.handleSubmit(handleManualSubmit)}
            >
              {isValidating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Host
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
