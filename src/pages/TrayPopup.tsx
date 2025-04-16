import { useState, useEffect } from "react";
import { Check, ChevronDown, ExternalLink, ChevronUp, ServerIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { profiles, hosts, serverInstances, serverDefinitions } from "@/data/mockData";
import { StatusIndicator } from "@/components/status/StatusIndicator";
import { NoSearchResults } from "@/components/servers/NoSearchResults";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";

interface InstanceStatus {
  id: string;
  definitionId: string;
  name: string;
  status: 'running' | 'connecting' | 'error' | 'stopped';
  enabled: boolean;
}

const TrayPopup = () => {
  const [selectedProfileIds, setSelectedProfileIds] = useState<Record<string, string>>(
    hosts.reduce((acc, host) => {
      if (host.profileId) {
        acc[host.id] = host.profileId;
      }
      return acc;
    }, {} as Record<string, string>)
  );

  const [activeInstances, setActiveInstances] = useState<Record<string, Record<string, string>>>({});
  
  const [instanceStatuses, setInstanceStatuses] = useState<Record<string, InstanceStatus[]>>({});
  
  const [expandedHosts, setExpandedHosts] = useState<Record<string, boolean>>({});

  const handleProfileChange = (hostId: string, profileId: string) => {
    setSelectedProfileIds(prev => ({
      ...prev,
      [hostId]: profileId
    }));
    
    initializeProfileInstances(hostId, profileId);
    
    const profile = profiles.find(p => p.id === profileId);
    toast.success(`Profile changed to ${profile?.name}`);
  };

  const initializeProfileInstances = (hostId: string, profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;
    
    const profileInstanceIds = profile.instances;
    
    const initialInstances: InstanceStatus[] = profileInstanceIds
      .map(instanceId => {
        const instance = serverInstances.find(s => s.id === instanceId);
        return instance ? {
          id: instance.id,
          definitionId: instance.definitionId,
          name: instance.name,
          status: 'connecting',
          enabled: instance.enabled
        } : null;
      })
      .filter(Boolean) as InstanceStatus[];
    
    setInstanceStatuses(prev => ({
      ...prev,
      [hostId]: initialInstances
    }));
    
    initialInstances.forEach((instance, index) => {
      setTimeout(() => {
        setInstanceStatuses(prev => {
          const hostInstances = [...(prev[hostId] || [])];
          const instanceIndex = hostInstances.findIndex(i => i.id === instance.id);
          
          if (instanceIndex !== -1) {
            const originalInstance = serverInstances.find(s => s.id === instance.id);
            hostInstances[instanceIndex] = {
              ...hostInstances[instanceIndex],
              status: originalInstance?.status || 'stopped'
            };
          }
          
          return {
            ...prev,
            [hostId]: hostInstances
          };
        });
      }, 1000 + (index * 500));
    });
  };

  const toggleInstanceEnabled = (hostId: string, instanceId: string) => {
    if (!instanceId) return;
    
    setInstanceStatuses(prev => {
      const hostInstances = [...(prev[hostId] || [])];
      const instanceIndex = hostInstances.findIndex(i => i.id === instanceId);
      
      if (instanceIndex !== -1) {
        hostInstances[instanceIndex] = {
          ...hostInstances[instanceIndex],
          enabled: !hostInstances[instanceIndex].enabled,
          status: !hostInstances[instanceIndex].enabled ? 'connecting' : 'stopped'
        };
        
        if (!hostInstances[instanceIndex].enabled) {
          setTimeout(() => {
            setInstanceStatuses(prevState => {
              const updatedHostInstances = [...(prevState[hostId] || [])];
              const idx = updatedHostInstances.findIndex(i => i.id === instanceId);
              
              if (idx !== -1 && updatedHostInstances[idx].status === 'connecting') {
                updatedHostInstances[idx] = {
                  ...updatedHostInstances[idx],
                  status: Math.random() > 0.2 ? 'running' : 'error'
                };
              }
              
              return {
                ...prevState,
                [hostId]: updatedHostInstances
              };
            });
          }, 1500);
        }
      }
      
      return {
        ...prev,
        [hostId]: hostInstances
      };
    });
    
    const instance = instanceStatuses[hostId]?.find(i => i.id === instanceId);
    const action = instance && !instance.enabled ? 'enabled' : 'disabled';
    toast.success(`Server instance ${action}`);
  };

  const handleInstanceChange = (hostId: string, definitionId: string, instanceId: string) => {
    setActiveInstances(prev => {
      const hostInstances = {...(prev[hostId] || {})};
      hostInstances[definitionId] = instanceId;
      
      return {
        ...prev,
        [hostId]: hostInstances
      };
    });
    
    console.log(`Changed instance for ${definitionId} to ${instanceId} for host ${hostId}`);
    
    setInstanceStatuses(prev => {
      const hostInstances = [...(prev[hostId] || [])];
      const instance = hostInstances.find(i => i.id === instanceId);
      
      if (instance && instance.enabled) {
        const instanceIndex = hostInstances.findIndex(i => i.id === instanceId);
        hostInstances[instanceIndex] = {
          ...hostInstances[instanceIndex],
          status: 'connecting'
        };
        
        setTimeout(() => {
          setInstanceStatuses(prevState => {
            const updatedHostInstances = [...(prevState[hostId] || [])];
            const idx = updatedHostInstances.findIndex(i => i.id === instanceId);
            
            if (idx !== -1 && updatedHostInstances[idx].status === 'connecting') {
              updatedHostInstances[idx] = {
                ...updatedHostInstances[idx],
                status: Math.random() > 0.2 ? 'running' : 'error'
              };
            }
            
            return {
              ...prevState,
              [hostId]: updatedHostInstances
            };
          });
        }, 1500);
      }
      
      return {
        ...prev,
        [hostId]: hostInstances
      };
    });
    
    toast.success("Server instance activated");
  };

  const toggleExpanded = (hostId: string) => {
    setExpandedHosts(prev => ({
      ...prev,
      [hostId]: !prev[hostId]
    }));
  };

  const getInstancesByDefinition = (hostId: string) => {
    const profileId = selectedProfileIds[hostId];
    if (!profileId) return [];
    
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return [];
    
    const hostStatusInstances = instanceStatuses[hostId] || [];
    const result: Array<{
      definition: typeof serverDefinitions[0],
      instances: typeof serverInstances,
      activeInstanceId: string,
      status: InstanceStatus | undefined
    }> = [];
    
    const definitionIds = new Set<string>();
    hostStatusInstances.forEach(instance => {
      definitionIds.add(instance.definitionId);
    });
    
    definitionIds.forEach(defId => {
      const definition = serverDefinitions.find(d => d.id === defId);
      if (!definition) return;
      
      const definitionInstances = serverInstances.filter(instance => 
        instance.definitionId === defId && 
        profile.instances.includes(instance.id)
      );
      
      const activeInstanceId = activeInstances[hostId]?.[defId] || definitionInstances[0]?.id || '';
      
      const status = hostStatusInstances.find(s => s.id === activeInstanceId);
      
      result.push({
        definition,
        instances: definitionInstances,
        activeInstanceId,
        status
      });
    });
    
    return result;
  };

  useEffect(() => {
    hosts.forEach(host => {
      const profileId = selectedProfileIds[host.id];
      if (profileId) {
        initializeProfileInstances(host.id, profileId);
      }
    });
  }, []);

  const openDashboard = () => {
    window.open("/", "_blank");
  };

  const activeHosts = hosts.filter(h => 
    h.connectionStatus === 'connected' || h.profileId
  );
  
  return (
    <div className="w-[420px] p-2 bg-background rounded-lg shadow-lg animate-fade-in max-h-[80vh]">
      <div className="flex items-center justify-between p-2 mb-2">
        <div className="flex items-center gap-2">
          <img 
            src="/lovable-uploads/0ad4c791-4d08-4e94-bbeb-3ac78aae67ef.png" 
            alt="MCP Now Logo" 
            className="h-6 w-6" 
          />
          <h2 className="font-medium">MCP Now</h2>
        </div>
        <Button 
          size="sm" 
          variant="ghost"
          className="text-xs flex items-center gap-1"
          onClick={openDashboard}
        >
          <span>Open Dashboard</span>
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>
      
      <ScrollArea className="h-full max-h-[calc(80vh-60px)]">
        <div className="pr-3">
          {activeHosts.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <p>No active connections</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeHosts.map(host => {
                const profileId = selectedProfileIds[host.id] || '';
                const profile = profiles.find(p => p.id === profileId);
                const isExpanded = expandedHosts[host.id] || false;
                const instanceGroups = getInstancesByDefinition(host.id);
                
                const totalInstances = instanceGroups.length;
                const showExpandCollapse = totalInstances > 2;
                
                const displayInstances = isExpanded ? instanceGroups : instanceGroups.slice(0, 2);
                
                return (
                  <Card key={host.id} className="overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between p-3 bg-card">
                      <div className="flex items-center gap-2">
                        <div className="bg-slate-900 text-white p-1 rounded w-8 h-8 flex items-center justify-center">
                          {host.icon ? <span className="text-lg">{host.icon}</span> : host.name.substring(0, 1)}
                        </div>
                        <h3 className="font-medium">{host.name}</h3>
                      </div>
                      <StatusIndicator 
                        status={host.connectionStatus === 'connected' ? 'active' : 'inactive'} 
                        label={host.connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
                      />
                    </div>
                    
                    <div className="p-3 pt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Profile:</span>
                        <Select
                          value={profileId}
                          onValueChange={(value) => handleProfileChange(host.id, value)}
                        >
                          <SelectTrigger className="h-8 flex-1">
                            <SelectValue placeholder="Select profile">
                              {profile && (
                                <div className="flex items-center gap-2">
                                  <StatusIndicator 
                                    status={profile.enabled ? 'active' : 'inactive'} 
                                  />
                                  <span>{profile.name}</span>
                                </div>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {profiles.map(profile => (
                              <SelectItem key={profile.id} value={profile.id}>
                                <div className="flex items-center gap-2">
                                  <StatusIndicator 
                                    status={profile.enabled ? 'active' : 'inactive'} 
                                  />
                                  <span>{profile.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {profileId && displayInstances.length > 0 && (
                        <div className="mt-3 bg-slate-50 rounded-md p-3">
                          <p className="text-xs text-muted-foreground mb-2">Active server instances:</p>
                          <div className="space-y-2">
                            {displayInstances.map(({ definition, instances, activeInstanceId, status }) => (
                              <div key={definition.id} className="flex items-center justify-between">
                                <div className="flex-1 min-w-0 mr-2">
                                  <span className="text-xs font-medium truncate block">{definition.name}</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-8 text-xs px-2 py-1 flex items-center gap-1"
                                      >
                                        <StatusIndicator 
                                          status={
                                            !status?.enabled ? 'inactive' :
                                            status.status === 'running' ? 'active' : 
                                            status.status === 'connecting' ? 'warning' :
                                            status.status === 'error' ? 'error' : 'inactive'
                                          } 
                                        />
                                        <span className="truncate max-w-[120px]">
                                          {instances.find(i => i.id === activeInstanceId)?.name.split('-').pop() || 'Select'}
                                        </span>
                                        <ChevronDown className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-40">
                                      {instances.map(instance => (
                                        <DropdownMenuItem
                                          key={instance.id}
                                          className={cn(
                                            "text-xs flex items-center justify-between",
                                            instance.id === activeInstanceId && "bg-accent"
                                          )}
                                          onClick={() => handleInstanceChange(host.id, definition.id, instance.id)}
                                          disabled={instance.id === activeInstanceId}
                                        >
                                          <span className="truncate max-w-[120px]">{instance.name.split('-').pop()}</span>
                                          {instance.id === activeInstanceId && (
                                            <Check className="h-3 w-3" />
                                          )}
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                  
                                  <Switch 
                                    checked={status?.enabled || false} 
                                    onCheckedChange={() => toggleInstanceEnabled(host.id, activeInstanceId)}
                                  />
                                </div>
                              </div>
                            ))}
                            
                            {showExpandCollapse && (
                              <div className="flex justify-end mt-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-xs text-primary flex items-center gap-1 h-6 px-2"
                                  onClick={() => toggleExpanded(host.id)}
                                >
                                  {isExpanded ? (
                                    <>
                                      <span>Collapse</span>
                                      <ChevronUp className="h-3 w-3" />
                                    </>
                                  ) : (
                                    <>
                                      <span>View all</span>
                                      <ChevronDown className="h-3 w-3" />
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {!profileId && (
                        <NoSearchResults 
                          entityName="server instances"
                          message="Select a profile to view server instances"
                          icon={<ServerIcon className="h-10 w-10 text-muted-foreground mb-4" />}
                          showButton={false}
                          customClassName="mt-3 border-slate-200"
                        />
                      )}
                      
                      {profileId && displayInstances.length === 0 && (
                        <NoSearchResults 
                          entityName="server instances"
                          message="No server instances available"
                          showButton={false}
                          customClassName="mt-3 border-slate-200"
                        />
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TrayPopup;
