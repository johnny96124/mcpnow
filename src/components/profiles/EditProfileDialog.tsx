
import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, AlertCircle, Info, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusIndicator } from "@/components/status/StatusIndicator";
import { 
  Profile, 
  ServerInstance, 
  serverDefinitions,
  EndpointType 
} from "@/data/mockData";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile;
  allInstances: ServerInstance[];
  onSave: (profile: Profile, newName: string, selectedInstanceIds: string[], endpoint: string, endpointType: EndpointType) => void;
}

export function EditProfileDialog({
  open,
  onOpenChange,
  profile,
  allInstances,
  onSave,
}: EditProfileDialogProps) {
  const [profileName, setProfileName] = useState(profile.name);
  const [selectedInstanceIds, setSelectedInstanceIds] = useState<string[]>(profile.instances);
  const [searchOpen, setSearchOpen] = useState(false);
  const [endpoint, setEndpoint] = useState(profile.endpoint);
  const [endpointType, setEndpointType] = useState<EndpointType>(profile.endpointType);

  useEffect(() => {
    if (open) {
      setProfileName(profile.name);
      setSelectedInstanceIds([...profile.instances]);
      setEndpoint(profile.endpoint);
      setEndpointType(profile.endpointType);
    }
  }, [open, profile]);

  const handleSave = () => {
    onSave(profile, profileName, selectedInstanceIds, endpoint, endpointType);
    onOpenChange(false);
  };

  const toggleInstance = (instanceId: string) => {
    setSelectedInstanceIds(prev => {
      if (prev.includes(instanceId)) {
        if (prev.length <= 1) {
          return prev;
        }
        return prev.filter(id => id !== instanceId);
      } else {
        return [...prev, instanceId];
      }
    });
  };

  const getSelectedDefinitionIds = () => {
    return selectedInstanceIds
      .map(id => {
        const instance = allInstances.find(inst => inst.id === id);
        return instance ? instance.definitionId : null;
      })
      .filter(Boolean) as string[];
  };

  const getInstancesForDropdown = () => {
    const selectedDefIds = getSelectedDefinitionIds();
    
    return allInstances.filter(instance => {
      // Filter out already selected instances
      if (selectedInstanceIds.includes(instance.id)) {
        return false;
      }
      // If we already have an instance from this definition, disable it
      return !selectedDefIds.includes(instance.definitionId);
    }).slice(0, 10); // Limit to 10 instances
  };

  const isInstanceDisabled = (instance: ServerInstance) => {
    const selectedDefIds = getSelectedDefinitionIds();
    return selectedDefIds.includes(instance.definitionId);
  };

  const selectedInstances = allInstances.filter(
    instance => selectedInstanceIds.includes(instance.id)
  );

  const getDefinitionName = (definitionId: string) => {
    const definition = serverDefinitions.find(def => def.id === definitionId);
    return definition ? definition.name : 'Unknown Definition';
  };

  const instancesForDropdown = getInstancesForDropdown();

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onOpenChange(false)}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Modify the profile name and manage server instances.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Profile Name</label>
            <Input 
              value={profileName} 
              onChange={(e) => setProfileName(e.target.value)} 
              placeholder="Enter profile name"
            />
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-medium">Connection Settings</Label>
            
            <div>
              <Label className="text-sm text-muted-foreground mb-1.5 block">Endpoint Type</Label>
              <Select 
                value={endpointType} 
                onValueChange={(value) => setEndpointType(value as EndpointType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select endpoint type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HTTP_SSE">HTTP SSE</SelectItem>
                  <SelectItem value="STDIO">Standard I/O</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm text-muted-foreground mb-1.5 block">Connection Endpoint</Label>
              <Input 
                value={endpoint} 
                onChange={(e) => setEndpoint(e.target.value)} 
                placeholder={
                  endpointType === "HTTP_SSE" 
                    ? "http://localhost:8008/mcp" 
                    : "/usr/local/bin/mcp-stdio"
                } 
              />
            </div>
          </div>

          <Alert variant="default" className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-xs text-blue-700">
              Each server definition can only be added once to a profile.
              At least one server instance must be in the profile.
            </AlertDescription>
          </Alert>

          <div>
            <label className="text-sm font-medium mb-2 block">Add Server Instance</label>
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={searchOpen}
                  className="w-full justify-between"
                >
                  Select a server instance...
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandList>
                    <CommandGroup>
                      {instancesForDropdown.length > 0 ? (
                        instancesForDropdown.map(instance => {
                          const isDisabled = isInstanceDisabled(instance);
                          return (
                            <CommandItem
                              key={instance.id}
                              disabled={isDisabled}
                              className={cn(
                                "flex items-center justify-between hover:bg-accent/50 transition-colors",
                                isDisabled && "opacity-50 cursor-not-allowed"
                              )}
                              onSelect={() => {
                                if (!isDisabled) {
                                  toggleInstance(instance.id);
                                  setSearchOpen(false);
                                }
                              }}
                            >
                              <div className="flex items-center gap-2 w-full cursor-pointer">
                                <StatusIndicator 
                                  status={
                                    instance.status === 'running' ? 'active' : 
                                    instance.status === 'error' ? 'error' : 'inactive'
                                  } 
                                />
                                <div className="flex flex-col flex-1">
                                  <span className={cn(
                                    "font-medium",
                                    isDisabled ? "text-muted-foreground" : ""
                                  )}>
                                    {instance.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {getDefinitionName(instance.definitionId)}
                                  </span>
                                </div>
                                
                                {!isDisabled && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-primary hover:text-primary hover:bg-accent h-7 w-7 p-0 ml-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleInstance(instance.id);
                                      setSearchOpen(false);
                                    }}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </CommandItem>
                          );
                        })
                      ) : (
                        <CommandEmpty>No available instances</CommandEmpty>
                      )}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Selected Instances ({selectedInstanceIds.length})</label>
            <ScrollArea className="h-[200px] rounded-md border">
              {selectedInstances.length > 0 ? (
                <div className="p-0">
                  {selectedInstances.map(instance => (
                    <div 
                      key={instance.id}
                      className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <StatusIndicator 
                          status={
                            instance.status === 'running' ? 'active' : 
                            instance.status === 'error' ? 'error' : 'inactive'
                          }
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">{instance.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {getDefinitionName(instance.definitionId)}
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => toggleInstance(instance.id)}
                        disabled={selectedInstanceIds.length <= 1}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No instances selected
                </div>
              )}
            </ScrollArea>
            {selectedInstanceIds.length <= 1 && (
              <p className="text-xs text-amber-600 mt-1">
                At least one instance must be selected
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!profileName.trim() || selectedInstanceIds.length === 0}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
