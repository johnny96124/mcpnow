import { useState, useEffect } from "react";
import { Search, RefreshCw, ServerCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hosts, profiles, serverDefinitions, type Host, type Profile, type ServerInstance } from "@/data/mockData";
import { ConfigFileDialog } from "@/components/hosts/ConfigFileDialog";
import { useToast } from "@/hooks/use-toast";
import { HostCard } from "@/components/hosts/HostCard";
import { HostSearch } from "@/components/hosts/HostSearch";
import { NoSearchResults } from "@/components/hosts/NoSearchResults";
import { useConfigDialog } from "@/hooks/useConfigDialog";
import { useHostProfiles } from "@/hooks/useHostProfiles";
import { markHostsOnboardingAsSeen } from "@/utils/localStorage";
import { Card, CardContent } from "@/components/ui/card";
import { AddServerToHostDialog } from "@/components/hosts/AddServerToHostDialog";
import { AddHostScanDialog } from "@/components/hosts/AddHostScanDialog";
import { ProfileSelector } from "@/components/hosts/ProfileSelector";
import { ServerCard } from "@/components/hosts/ServerCard";

const mockJsonConfig = {
  "mcpServers": {
    "mcpnow": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/mcpnow", "http://localhost:8008/mcp"]
    }
  }
};

interface ActiveProfile extends Profile {
  servers: ServerInstance[];
}

const Hosts = () => {
  useEffect(() => {
    markHostsOnboardingAsSeen();
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [hostsList, setHostsList] = useState<Host[]>(hosts);
  const [addHostDialogOpen, setAddHostDialogOpen] = useState(false);
  const [addServerDialogOpen, setAddServerDialogOpen] = useState(false);
  const [selectedHostForServer, setSelectedHostForServer] = useState<Host | null>(null);
  const [showHostRefreshHint, setShowHostRefreshHint] = useState(false);
  const [localProfiles, setLocalProfiles] = useState<Profile[]>(profiles);
  const [activeProfileId, setActiveProfileId] = useState<string>(profiles[0]?.id || "");
  const [profileServers, setProfileServers] = useState<Record<string, ServerInstance[]>>({});

  const {
    hostProfiles,
    handleProfileChange
  } = useHostProfiles();

  const {
    configDialog,
    openConfigDialog,
    setDialogOpen,
    resetConfigDialog
  } = useConfigDialog(mockJsonConfig);

  const { toast } = useToast();

  const filteredHosts = hostsList.filter(host => host.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const clearSearch = () => setSearchQuery("");

  const getProfileEndpoint = (profileId: string) => {
    const profile = localProfiles.find(p => p.id === profileId);
    return profile ? profile.endpoint : null;
  };

  const handleOpenConfigDialog = (hostId: string) => {
    const host = hostsList.find(h => h.id === hostId);
    if (host && host.configPath) {
      const profileId = hostProfiles[host.id] || '';
      const profileEndpoint = getProfileEndpoint(profileId);
      openConfigDialog(hostId, host.configPath, profileEndpoint, false, false, true);
    } else {
      toast({
        title: "No config file",
        description: "This host doesn't have a configuration file yet. Please create a configuration first.",
        variant: "destructive"
      });
    }
  };

  const handleCreateConfigDialog = (hostId: string, profileId?: string) => {
    const host = hostsList.find(h => h.id === hostId);
    if (host) {
      const selectedProfileId = profileId || hostProfiles[host.id] || '';
      const profileEndpoint = getProfileEndpoint(selectedProfileId);
      const defaultConfigPath = `/Users/user/.mcp/hosts/${host.name.toLowerCase().replace(/\s+/g, '-')}.json`;
      openConfigDialog(hostId, defaultConfigPath, profileEndpoint, true, true, false, false, true, true);
    }
  };

  const handleUpdateConfigDialog = (hostId: string) => {
    const host = hostsList.find(h => h.id === hostId);
    if (host) {
      const profileId = hostProfiles[host.id] || '';
      const profileEndpoint = getProfileEndpoint(profileId);
      if (host.configPath) {
        openConfigDialog(hostId, host.configPath, profileEndpoint, true, false, false, false, true);
      } else {
        const defaultConfigPath = `/Users/user/.mcp/hosts/${host.name.toLowerCase().replace(/\s+/g, '-')}.json`;
        openConfigDialog(hostId, defaultConfigPath, profileEndpoint, true, true, false, false, true, false);
      }
    }
  };

  const handleAddHost = (newHosts: Host[]) => {
    // Create a new profile for each host if there are none
    newHosts.forEach(newHost => {
      // Add host to the list
      setHostsList(prev => [...prev, newHost]);
      
      // Create a default profile if none exists
      if (localProfiles.length === 0) {
        const newProfileId = `profile-${Date.now()}`;
        const newProfile: Profile = {
          id: newProfileId,
          name: `${newHost.name} Profile`,
          description: `Default profile for ${newHost.name}`,
          endpoint: "http://localhost:8008",
          endpointType: "HTTP_SSE",
          enabled: true,
          instances: []
        };
        setLocalProfiles([newProfile]);
        setActiveProfileId(newProfileId);
      }
      
      // Show success toast
      toast({
        title: "Host Added",
        description: `${newHost.name} has been added and configured successfully`
      });
    });
  };

  const handleUpdateConfig = (config: string, configPath: string) => {
    if (configDialog.hostId) {
      setHostsList(prev => prev.map(host => host.id === configDialog.hostId ? {
        ...host,
        configPath,
        configStatus: 'configured',
        connectionStatus: 'connected'
      } : host));
      toast({
        title: "Configuration complete",
        description: "Now you can select a profile for this host to connect to."
      });
    }
    resetConfigDialog();
  };

  const handleAddServers = (servers: ServerInstance[]) => {
    if (!selectedHostForServer) return;
    
    // Add servers to active profile
    setProfileServers(prev => ({
      ...prev,
      [activeProfileId]: [...(prev[activeProfileId] || []), ...servers]
    }));
    
    toast({
      title: "Servers added",
      description: `Successfully added ${servers.length} servers to the profile.`
    });
  };

  const handleCreateProfile = (name: string) => {
    const newProfileId = `profile-${Date.now()}`;
    const newProfile: Profile = {
      id: newProfileId,
      name,
      description: `Profile for ${name}`,
      endpoint: "http://localhost:8008",
      endpointType: "HTTP_SSE",
      enabled: true,
      instances: []
    };
    
    setLocalProfiles(prev => [...prev, newProfile]);
    setActiveProfileId(newProfileId);
  };

  const handleDeleteProfile = (profileId: string) => {
    // Don't delete if it's the last profile
    if (localProfiles.length <= 1) {
      toast({
        title: "Cannot delete profile",
        description: "You need at least one profile.",
        variant: "destructive"
      });
      return;
    }
    
    // Delete profile and switch to another one
    setLocalProfiles(prev => prev.filter(p => p.id !== profileId));
    
    if (activeProfileId === profileId) {
      const remainingProfiles = localProfiles.filter(p => p.id !== profileId);
      setActiveProfileId(remainingProfiles[0].id);
    }
    
    // Remove servers associated with this profile
    setProfileServers(prev => {
      const { [profileId]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleRemoveServer = (serverId: string) => {
    setProfileServers(prev => ({
      ...prev,
      [activeProfileId]: (prev[activeProfileId] || []).filter(s => s.id !== serverId)
    }));
    
    toast({
      title: "Server removed",
      description: "The server has been removed from this profile."
    });
  };
  
  const activeProfile: ActiveProfile | undefined = localProfiles.find(p => p.id === activeProfileId) ? {
    ...(localProfiles.find(p => p.id === activeProfileId) as Profile),
    servers: profileServers[activeProfileId] || []
  } : undefined;
  
  const selectedHostConnectionStatus = selectedHostForServer?.connectionStatus || "unknown";
  const isConnected = selectedHostConnectionStatus === "connected";

  const handleAddServerToHost = (host: Host) => {
    setSelectedHostForServer(host);
    setAddServerDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hosts</h1>
          <p className="text-muted-foreground">
            Manage host connections and server configurations
          </p>
        </div>
        <Button onClick={() => setAddHostDialogOpen(true)}>
          <ServerCog className="h-4 w-4 mr-2" />
          Add Host
        </Button>
      </div>
      
      <HostSearch searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      
      {filteredHosts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredHosts.map(host => (
            <HostCard 
              key={host.id} 
              host={host} 
              profileId={hostProfiles[host.id] || ''} 
              onProfileChange={handleProfileChange}
              onOpenConfigDialog={handleOpenConfigDialog}
              onCreateConfig={handleCreateConfigDialog}
              onFixConfig={handleUpdateConfigDialog}
              showHostRefreshHint={showHostRefreshHint}
              onAddServer={() => handleAddServerToHost(host)}
            />
          ))}
        </div>
      ) : searchQuery ? (
        <NoSearchResults query={searchQuery} onClear={clearSearch} />
      ) : (
        <Card className="border-2 border-dashed bg-muted/50 hover:bg-muted/80 transition-colors">
          <CardContent className="p-6 h-[400px] flex flex-col items-center justify-center text-center space-y-5">
            <div className="rounded-full bg-primary/10 p-4">
              <ServerCog className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">No Hosts Yet</h3>
              <p className="text-muted-foreground">
                Add your first host to start connecting with MCP servers
              </p>
            </div>
            <Button onClick={() => setAddHostDialogOpen(true)} className="mt-4">
              <ServerCog className="h-4 w-4 mr-2" />
              Add Your First Host
            </Button>
          </CardContent>
        </Card>
      )}
      
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold tracking-tight">Connected Servers</h2>
          {localProfiles.length > 0 && (
            <ProfileSelector 
              profiles={localProfiles}
              currentProfileId={activeProfileId}
              onProfileChange={setActiveProfileId}
              onCreateProfile={handleCreateProfile}
              onDeleteProfile={handleDeleteProfile}
            />
          )}
        </div>
        
        {activeProfile ? (
          <div className="space-y-4">
            {activeProfile.servers.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {activeProfile.servers.map(server => (
                  <ServerCard
                    key={server.id}
                    server={server}
                    hostConnected={isConnected}
                    onRemoveServer={handleRemoveServer}
                    onViewDetails={() => {
                      toast({
                        title: "Server details",
                        description: "This would open the server details view."
                      });
                    }}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-2 border-dashed bg-muted/50">
                <CardContent className="p-6 h-[300px] flex flex-col items-center justify-center text-center space-y-5">
                  <div className="rounded-full bg-primary/10 p-4">
                    <ServerCog className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">No Servers Added</h3>
                    <p className="text-muted-foreground">
                      Add servers to this profile from your connected hosts
                    </p>
                  </div>
                  <Button 
                    onClick={() => {
                      if (filteredHosts.length > 0) {
                        setSelectedHostForServer(filteredHosts[0]);
                        setAddServerDialogOpen(true);
                      } else {
                        toast({
                          title: "No hosts available",
                          description: "You need to add a host before adding servers.",
                          variant: "destructive"
                        });
                      }
                    }} 
                    disabled={filteredHosts.length === 0}
                    className="mt-4"
                  >
                    <ServerCog className="h-4 w-4 mr-2" />
                    Add Server
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card className="border-2 border-dashed bg-muted/50">
            <CardContent className="p-6 h-[300px] flex flex-col items-center justify-center text-center space-y-5">
              <div className="rounded-full bg-primary/10 p-4">
                <ServerCog className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">No Profiles Created</h3>
                <p className="text-muted-foreground">
                  Add a host first to create your default profile
                </p>
              </div>
              <Button onClick={() => setAddHostDialogOpen(true)} className="mt-4">
                <ServerCog className="h-4 w-4 mr-2" />
                Add Your First Host
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      
      <ConfigFileDialog 
        open={configDialog.isOpen} 
        onOpenChange={setDialogOpen} 
        configPath={configDialog.configPath} 
        initialConfig={configDialog.configContent} 
        onSave={handleUpdateConfig} 
        profileEndpoint={configDialog.profileEndpoint} 
        needsUpdate={configDialog.needsUpdate} 
        allowPathEdit={configDialog.allowPathEdit} 
        isViewOnly={configDialog.isViewOnly} 
        isFixMode={configDialog.isFixMode} 
        isUpdateMode={configDialog.isUpdateMode} 
        isCreateMode={configDialog.isCreateMode} 
      />
      
      <AddHostScanDialog 
        open={addHostDialogOpen} 
        onOpenChange={setAddHostDialogOpen} 
        onAddHosts={handleAddHost} 
      />
      
      <AddServerToHostDialog
        open={addServerDialogOpen}
        onOpenChange={setAddServerDialogOpen}
        onAddServers={handleAddServers}
      />
    </div>
  );
};

export default Hosts;
