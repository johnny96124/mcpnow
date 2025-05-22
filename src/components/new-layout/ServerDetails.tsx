import { useState, useEffect } from "react";
import { ServerInstance, serverDefinitions } from "@/data/mockData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Save, Check, Info, RefreshCw, Trash2, X, Plus, ExternalLink, Edit } from "lucide-react";
import { EndpointLabel } from "@/components/status/EndpointLabel";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";

interface ServerDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  server: ServerInstance | null;
  onDelete: (id: string) => void;
  onStatusChange?: (serverId: string, status: 'running' | 'stopped' | 'error' | 'connecting') => void;
}

export function ServerDetails({
  open,
  onOpenChange,
  server,
  onDelete,
  onStatusChange
}: ServerDetailsProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isRefreshingTools, setIsRefreshingTools] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const { toast } = useToast();
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    connectionDetails: "",
    envVars: {} as Record<string, string>,
  });
  
  // Environment variables state
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [isAddingVar, setIsAddingVar] = useState(false);
  const [newEnvKey, setNewEnvKey] = useState("");
  const [newEnvValue, setNewEnvValue] = useState("");
  const [editingVar, setEditingVar] = useState<string | null>(null);
  
  // Reset form data when server changes
  useEffect(() => {
    if (server) {
      setFormData({
        name: server.name,
        connectionDetails: server.connectionDetails,
        envVars: server.environment || {},
      });
      setEnvVars(server.environment || {});
      setUnsavedChanges(false);
    }
  }, [server]);

  // Track changes
  useEffect(() => {
    if (server) {
      const hasChanges = 
        formData.name !== server.name ||
        formData.connectionDetails !== server.connectionDetails ||
        JSON.stringify(envVars) !== JSON.stringify(server.environment || {});
      setUnsavedChanges(hasChanges);
    }
  }, [formData, envVars, server]);
  
  // Find the definition with null checking for server
  const definition = server && serverDefinitions.find(def => def.id === server.definitionId);
  
  // Add the missing handleViewResourceDetails function
  const handleViewResourceDetails = () => {
    // For now, just show a toast to indicate this functionality
    // would typically open the resource details in a new view
    toast({
      title: "Resource Details",
      description: `Viewing details for ${definition?.name || "Unknown"} resource`,
    });
    
    // In a real application, this might navigate to a dedicated page
    // or open another dialog with more detailed information
  };
  
  const handleDelete = () => {
    if (confirmDelete && server) {
      onDelete(server.id);
      onOpenChange(false);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // Here you would typically update the server data
    // For now, we'll just show a success toast
    toast({
      title: "Changes saved",
      description: "Your changes have been saved successfully",
      type": "success"
    });
    setUnsavedChanges(false);
  };

  const handleCloseAttempt = () => {
    if (unsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      onOpenChange(false);
    }
  };

  const handleAddEnvVar = () => {
    if (isAddingVar) {
      if (!newEnvKey.trim()) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Variable name cannot be empty"
        });
        return;
      }

      setEnvVars(prev => ({
        ...prev,
        [newEnvKey]: newEnvValue
      }));
      setNewEnvKey("");
      setNewEnvValue("");
      setIsAddingVar(false);
    } else {
      setIsAddingVar(true);
    }
  };

  const handleDeleteEnvVar = (key: string) => {
    const newEnvVars = { ...envVars };
    delete newEnvVars[key];
    setEnvVars(newEnvVars);
  };

  const handleCancelAdd = () => {
    setIsAddingVar(false);
    setNewEnvKey("");
    setNewEnvValue("");
  };

  const handleRefreshTools = () => {
    setIsRefreshingTools(true);
    // Simulate tool refresh
    setTimeout(() => {
      setIsRefreshingTools(false);
      toast({
        title: "Tools Refreshed",
        description: "Available tools list has been updated"
      });
    }, 1000);
  };

  // If server is null, don't render the dialog content
  if (!server) {
    return (
      <Dialog open={open} onOpenChange={handleCloseAttempt}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Server Details</DialogTitle>
            <DialogDescription>
              No server selected
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <>
      <Dialog open={open} onOpenChange={handleCloseAttempt}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>Server Details</span>
              <Badge variant="outline">{definition?.name || "Unknown"}</Badge>
              <EndpointLabel type={definition?.type || "STDIO"} />
            </DialogTitle>
            <DialogDescription>
              View and manage server instance settings
            </DialogDescription>
          </DialogHeader>
          
          <Tabs
            defaultValue="general"
            value={activeTab}
            onValueChange={setActiveTab}
            className="mt-2"
          >
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="configuration">Configuration</TabsTrigger>
              <TabsTrigger value="tools">Tools</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input 
                    value={formData.name} 
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex items-center h-10 px-3 border rounded-md">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      server.status === "running" ? "bg-green-500" : 
                      server.status === "error" ? "bg-red-500" : 
                      server.status === "connecting" ? "bg-yellow-500" : "bg-gray-500"
                    }`}></div>
                    <span className="capitalize">{server.status}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Connection Details</Label>
                <Input 
                  value={formData.connectionDetails} 
                  onChange={(e) => handleInputChange("connectionDetails", e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Server Resource</Label>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-blue-600 hover:text-blue-700"
                    onClick={handleViewResourceDetails}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
                <div className="border rounded-md p-4 bg-muted/30">
                  <div className="flex items-start gap-4">
                    {definition?.icon && (
                      <div className="text-2xl">{definition.icon}</div>
                    )}
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{definition?.name || "Unknown"}</h4>
                        <EndpointLabel type={definition?.type || "STDIO"} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {definition?.description || "No description available"}
                      </p>
                      {definition?.categories && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {definition.categories.map(category => (
                            <Badge key={category} variant="secondary" className="text-xs">
                              {category}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="configuration" className="pt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">Environment Variables</h4>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleAddEnvVar}
                    disabled={isAddingVar}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Variable
                  </Button>
                </div>
                
                <Card className="p-4">
                  {Object.keys(envVars).length === 0 && !isAddingVar ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Info className="h-8 w-8 text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground">
                        No environment variables defined. Click 'Add Variable' to add one.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(envVars).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-4">
                          {editingVar === key ? (
                            <>
                              <Input 
                                value={newEnvKey} 
                                onChange={(e) => setNewEnvKey(e.target.value)}
                                placeholder="Variable Name"
                                className="flex-1"
                              />
                              <Input 
                                value={newEnvValue}
                                onChange={(e) => setNewEnvValue(e.target.value)}
                                placeholder="Value"
                                className="flex-1"
                              />
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    if (newEnvKey.trim()) {
                                      const updatedEnvVars = { ...envVars };
                                      delete updatedEnvVars[key];
                                      updatedEnvVars[newEnvKey] = newEnvValue;
                                      setEnvVars(updatedEnvVars);
                                      setEditingVar(null);
                                    }
                                  }}
                                  className="h-9 w-9"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditingVar(null);
                                    setNewEnvKey("");
                                    setNewEnvValue("");
                                  }}
                                  className="h-9 w-9"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <Input 
                                value={key} 
                                readOnly
                                className="flex-1 bg-muted/50"
                              />
                              <Input 
                                value={value} 
                                readOnly
                                className="flex-1 bg-muted/50"
                              />
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditingVar(key);
                                    setNewEnvKey(key);
                                    setNewEnvValue(value);
                                  }}
                                  className="h-9 w-9 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteEnvVar(key)}
                                  className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                      
                      {isAddingVar && (
                        <div className="flex items-center gap-4">
                          <Input 
                            value={newEnvKey}
                            onChange={(e) => setNewEnvKey(e.target.value)}
                            placeholder="Variable Name"
                            className="flex-1"
                          />
                          <Input 
                            value={newEnvValue}
                            onChange={(e) => setNewEnvValue(e.target.value)}
                            placeholder="Value"
                            className="flex-1"
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={handleAddEnvVar}
                              className="h-9 w-9"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleCancelAdd}
                              className="h-9 w-9"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="tools" className="pt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Available Tools</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshTools}
                    disabled={isRefreshingTools}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshingTools ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
                
                {definition?.tools && definition.tools.length > 0 ? (
                  <ScrollArea className="h-[250px] border rounded-md">
                    <div className="p-1 space-y-3">
                      {definition.tools.map(tool => (
                        <div key={tool.id} className="border rounded-md p-3">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium">{tool.name}</h5>
                            <Badge variant="outline" className="text-xs">Tool</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {tool.description}
                          </p>
                          
                          {tool.parameters && tool.parameters.length > 0 && (
                            <div className="mt-3">
                              <h6 className="text-xs font-medium text-muted-foreground mb-2">Parameters</h6>
                              <div className="space-y-1.5">
                                {tool.parameters.map(param => (
                                  <div key={param.name} className="text-xs grid grid-cols-[120px,1fr] gap-2 bg-muted/60 p-1.5 rounded-sm">
                                    <div className="font-mono">{param.name}</div>
                                    <div className="text-muted-foreground">{param.type}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="border-2 border-dashed rounded-md h-[200px] flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <Info className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>No tools available for this server</p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="flex justify-between items-center mt-6">
            <Button 
              variant="outline" 
              className={`${confirmDelete ? "bg-red-100 text-red-600 hover:bg-red-200" : "text-destructive"}`}
              onClick={handleDelete}
            >
              {confirmDelete ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirm Delete
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
            
            <div className="flex gap-2">
              {confirmDelete && (
                <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={handleCloseAttempt}
              >
                Close
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!unsavedChanges}
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to close without saving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowUnsavedDialog(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowUnsavedDialog(false);
                onOpenChange(false);
              }}
            >
              Close without saving
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
