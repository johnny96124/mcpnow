
import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, ServerIcon, AlertCircle, Info, Globe, TerminalSquare } from "lucide-react";
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
  CommandInput,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile;
  allInstances: ServerInstance[];
  onSave: (profile: Profile, newName: string, selectedInstanceIds: string[], newEndpoint: string, newEndpointType: EndpointType) => void;
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
  const [endpointType, setEndpointType] = useState<EndpointType>(profile.endpointType);
  const [endpoint, setEndpoint] = useState(profile.endpoint);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setProfileName(profile.name);
      setSelectedInstanceIds([...profile.instances]);
      setEndpointType(profile.endpointType);
      setEndpoint(profile.endpoint);
    }
  }, [open, profile]);

  const handleSave = () => {
    onSave(profile, profileName, selectedInstanceIds, endpoint, endpointType);
    onOpenChange(false);
  };

  const toggleInstance = (instanceId: string) => {
    setSelectedInstanceIds(prev => {
      if (prev.includes(instanceId)) {
        // Don't allow removing if it's the last instance
        if (prev.length <= 1) {
          return prev;
        }
        return prev.filter(id => id !== instanceId);
      } else {
        return [...prev, instanceId];
      }
    });
  };

  // Get already selected definition IDs
  const selectedDefinitionIds = new Set(
    selectedInstanceIds
      .map(id => allInstances.find(instance => instance.id === id)?.definitionId)
      .filter(Boolean)
  );
  
  // Filter available instances - exclude those whose definition is already included
  const availableInstances = allInstances.filter(
    instance => 
      !selectedInstanceIds.includes(instance.id) && 
      !selectedDefinitionIds.has(instance.definitionId)
  );

  // Get the selected instances
  const selectedInstances = allInstances.filter(
    instance => selectedInstanceIds.includes(instance.id)
  );

  // Get definition name for an instance
  const getDefinitionName = (definitionId: string) => {
    const definition = serverDefinitions.find(def => def.id === definitionId);
    return definition ? definition.name : 'Unknown Definition';
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onOpenChange(false)}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Modify the profile name, endpoints, and manage server instances.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Profile name */}
          <div>
            <Label htmlFor="profile-name" className="text-sm font-medium mb-2 block">Profile Name</Label>
            <Input 
              id="profile-name"
              value={profileName} 
              onChange={(e) => setProfileName(e.target.value)} 
              placeholder="Enter profile name"
            />
          </div>

          {/* Endpoint Configuration */}
          <div className="space-y-2">
            <Label className="text-sm font-medium block">Connection Endpoint</Label>
            <Select value={endpointType} onValueChange={(value: EndpointType) => setEndpointType(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select endpoint type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HTTP_SSE">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-500" />
                    <span>HTTP SSE</span>
                  </div>
                </SelectItem>
                <SelectItem value="TCP_SOCKET">
                  <div className="flex items-center gap-2">
                    <TerminalSquare className="h-4 w-4 text-purple-500" />
                    <span>TCP Socket</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Input 
              value={endpoint} 
              onChange={(e) => setEndpoint(e.target.value)} 
              placeholder={endpointType === 'HTTP_SSE' ? "https://example.com/events" : "localhost:9000"}
              className="mt-2"
            />
          </div>

          {/* Info alert about instance selection */}
          <Alert variant="default" className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-xs text-blue-700">
              Each server definition can only be added once to a profile.
              At least one server instance must be in the profile.
            </AlertDescription>
          </Alert>

          {/* Add new instance dropdown */}
          <div>
            <label className="text-sm font-medium mb-2 block">Add Server Instance</label>
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={searchOpen}
                  className="w-full justify-between"
                  disabled={availableInstances.length === 0}
                >
                  {availableInstances.length > 0 
                    ? "Select a server instance..." 
                    : "No available instances"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput placeholder="Search instances..." />
                  <CommandEmpty>No instances found.</CommandEmpty>
                  <CommandList>
                    <CommandGroup>
                      {availableInstances.map(instance => (
                        <CommandItem
                          key={instance.id}
                          onSelect={() => {
                            toggleInstance(instance.id);
                            setSearchOpen(false);
                          }}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex flex-col">
                              <span>{instance.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {getDefinitionName(instance.definitionId)}
                              </span>
                            </div>
                            <StatusIndicator 
                              status={
                                instance.status === 'running' ? 'active' : 
                                instance.status === 'error' ? 'error' : 'inactive'
                              } 
                            />
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* List of currently selected instances */}
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
                      <div className="flex flex-col">
                        <span className="font-medium">{instance.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {getDefinitionName(instance.definitionId)}
                        </span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => toggleInstance(instance.id)}
                        disabled={selectedInstanceIds.length <= 1}
                      >
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
          <Button 
            onClick={handleSave} 
            disabled={!profileName.trim() || selectedInstanceIds.length === 0 || !endpoint.trim()}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
