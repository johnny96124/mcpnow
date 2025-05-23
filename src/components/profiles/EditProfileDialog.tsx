
import { useState, useEffect } from "react";
import { PlusCircle, Trash2, Plus, AlertCircle, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Profile, ServerInstance, serverDefinitions } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile;
  allInstances: ServerInstance[];
  onSave: (profile: Profile, newName: string, selectedInstanceIds: string[], endpoint: string, endpointType: string) => void;
}

interface InstanceSelection {
  id: string;
  definitionId: string;
  instanceId: string;
}

export function EditProfileDialog({
  open,
  onOpenChange,
  profile,
  allInstances,
  onSave,
}: EditProfileDialogProps) {
  const { toast } = useToast();
  const [profileName, setProfileName] = useState(profile.name);
  const [selections, setSelections] = useState<InstanceSelection[]>([]);
  
  const instancesByDefinition = allInstances.reduce((acc, instance) => {
    if (!acc[instance.definitionId]) {
      acc[instance.definitionId] = [];
    }
    acc[instance.definitionId].push(instance);
    return acc;
  }, {} as Record<string, ServerInstance[]>);
  
  const definitionIds = [...new Set(allInstances.map(instance => instance.definitionId))];

  useEffect(() => {
    if (open) {
      setProfileName(profile.name);
      
      const initialSelections: InstanceSelection[] = [];
      
      const selectedInstances = profile.instances.map(
        instanceId => allInstances.find(inst => inst.id === instanceId)
      ).filter(Boolean) as ServerInstance[];
      
      selectedInstances.forEach(instance => {
        initialSelections.push({
          id: `selection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          definitionId: instance.definitionId,
          instanceId: instance.id
        });
      });
      
      if (initialSelections.length === 0) {
        initialSelections.push({ 
          id: `selection-${Date.now()}`, 
          definitionId: "", 
          instanceId: "" 
        });
      }
      
      setSelections(initialSelections);
    }
  }, [open, profile, allInstances]);

  const addSelection = () => {
    setSelections([
      ...selections, 
      { 
        id: `selection-${Date.now()}`, 
        definitionId: "", 
        instanceId: "" 
      }
    ]);
  };

  const removeSelection = (id: string) => {
    // Allow removing all selections for the profile
    setSelections(selections.filter(selection => selection.id !== id));
    
    // If we removed the last selection, add an empty one
    if (selections.length === 1 && selections[0].id === id) {
      setSelections([{ 
        id: `selection-${Date.now()}`, 
        definitionId: "", 
        instanceId: "" 
      }]);
    }
  };

  const updateDefinitionId = (id: string, definitionId: string) => {
    setSelections(selections.map(selection => 
      selection.id === id ? { ...selection, definitionId, instanceId: "" } : selection
    ));
  };

  const updateInstanceId = (id: string, instanceId: string) => {
    setSelections(selections.map(selection => 
      selection.id === id ? { ...selection, instanceId } : selection
    ));
  };

  const getDefinitionName = (definitionId: string) => {
    const definition = serverDefinitions.find(def => def.id === definitionId);
    return definition ? definition.name : 'Unknown Definition';
  };

  const getAvailableDefinitionIds = (currentSelectionId: string) => {
    const usedDefinitionIds = selections
      .filter(s => s.id !== currentSelectionId && s.definitionId)
      .map(s => s.definitionId);
    
    return definitionIds.filter(defId => !usedDefinitionIds.includes(defId));
  };

  const handleSave = () => {
    const selectedInstanceIds = selections
      .filter(selection => selection.instanceId)
      .map(selection => selection.instanceId);

    // Allow saving with zero instances
    onSave(profile, profileName, selectedInstanceIds, profile.endpoint, profile.endpointType);
    onOpenChange(false);
  };

  // Clear all selections
  const handleClearAll = () => {
    setSelections([{ 
      id: `selection-${Date.now()}`, 
      definitionId: "", 
      instanceId: "" 
    }]);
    
    toast({
      title: "All instances removed",
      description: "You can add new instances or save the profile with no instances."
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onOpenChange(false)}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Modify profile name and server instances.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div>
            <label className="text-sm font-medium">Profile Name</label>
            <Input 
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Enter profile name"
              className="mt-1.5"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Server Instances</label>
              <div className="flex gap-2">
                {selections.some(s => s.instanceId) && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    className="text-destructive"
                    onClick={handleClearAll}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Clear All
                  </Button>
                )}
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addSelection}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Instance
                </Button>
              </div>
            </div>

            {selections.map((selection) => (
              <div key={selection.id} className="flex items-center gap-2">
                <div className="flex-1">
                  <Select
                    value={selection.definitionId}
                    onValueChange={(value) => updateDefinitionId(selection.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select definition" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableDefinitionIds(selection.id).map(defId => (
                        <SelectItem key={defId} value={defId}>
                          {getDefinitionName(defId)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Select
                    value={selection.instanceId}
                    onValueChange={(value) => updateInstanceId(selection.id, value)}
                    disabled={!selection.definitionId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select instance" />
                    </SelectTrigger>
                    <SelectContent>
                      {selection.definitionId && 
                        instancesByDefinition[selection.definitionId]?.map(instance => (
                          <SelectItem key={instance.id} value={instance.id}>
                            {instance.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSelection(selection.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Alert variant="default" className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-xs text-blue-700">
              Each server definition can only be selected once.
              Profiles can be saved with zero instances if needed.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={handleSave}
            disabled={!profileName.trim()}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
