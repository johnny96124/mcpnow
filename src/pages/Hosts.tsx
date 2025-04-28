
import { useState, useEffect } from "react";
import { PlusCircle, Search, RefreshCw, FileText, Info, ScanLine, ServerCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hosts } from "@/data/mockData";
import { ConfigFileDialog } from "@/components/hosts/ConfigFileDialog";
import { useToast } from "@/hooks/use-toast";
import { HostCard } from "@/components/hosts/HostCard";
import { HostSearch } from "@/components/hosts/HostSearch";
import { NoSearchResults } from "@/components/hosts/NoSearchResults";
import { useConfigDialog } from "@/hooks/useConfigDialog";
import { useHostProfiles } from "@/hooks/useHostProfiles";
import { AddHostDialog } from "@/components/hosts/AddHostDialog";
import { ConnectionStatus, Host, profiles, ServerDefinition } from "@/data/mockData";
import { Skeleton } from "@/components/ui/skeleton";
import { markHostsOnboardingAsSeen } from "@/utils/localStorage";
import { Card, CardContent } from "@/components/ui/card";
import { AddServerToHostDialog } from "@/components/hosts/AddServerToHostDialog";

const mockJsonConfig = {
  "mcpServers": {
    "mcpnow": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/mcpnow", "http://localhost:8008/mcp"]
    }
  }
};

const Hosts = () => {
  useEffect(() => {
    markHostsOnboardingAsSeen();
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [hostsList, setHostsList] = useState<Host[]>(hosts);
  const [addHostDialogOpen, setAddHostDialogOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showHostRefreshHint, setShowHostRefreshHint] = useState(false);
  const [addServerDialogOpen, setAddServerDialogOpen] = useState(false);

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

  const {
    toast
  } = useToast();

  const filteredHosts = hostsList.filter(host => host.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const clearSearch = () => setSearchQuery("");

  const getProfileEndpoint = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
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

  const handleScanForHosts = () => {
    setIsScanning(true);
    setTimeout(() => {
      const foundHost = Math.random() > 0.5;
      if (foundHost) {
        const newId = `host-${Date.now()}`;
        const newHost: Host = {
          id: newId,
          name: "Local Host",
          icon: "💻",
          connectionStatus: "disconnected",
          configStatus: "unknown"
        };
        setHostsList(prevHosts => [...prevHosts, newHost]);
        toast({
          title: "Host discovered",
          description: "A new local host has been found and added to your hosts list."
        });
        setTimeout(() => {
          toast({
            title: "Configure new host",
            description: "Configure this host to connect it with your profiles."
          });
        }, 500);
      } else {
        toast({
          title: "No hosts found",
          description: "No new hosts were discovered on your network.",
          variant: "destructive"
        });
      }
      setIsScanning(false);
    }, 2500);
  };

  const handleAddHost = (newHost: {
    name: string;
    configPath?: string;
    icon?: string;
    configStatus: "configured" | "misconfigured" | "unknown";
    connectionStatus: ConnectionStatus;
  }) => {
    const id = `host-${Date.now()}`;
    const host: Host = {
      id,
      ...newHost,
      connectionStatus: "disconnected"
    };
    setHostsList([...hostsList, host]);
    toast({
      title: "Host Added",
      description: `${newHost.name} has been added successfully`
    });
    setTimeout(() => {
      toast({
        title: "Configure new host",
        description: "Configure this host to connect it with your profiles."
      });
    }, 500);
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

  const handleAddServers = (selectedServers: ServerDefinition[]) => {
    toast({
      title: "Servers added",
      description: `Successfully added ${selectedServers.length} servers to the host.`
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hosts</h1>
          <p className="text-muted-foreground">
            Manage host connections and profile associations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleScanForHosts} disabled={isScanning}>
            {isScanning ? <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Scanning...
              </> : <>
                <Search className="h-4 w-4 mr-2" />
                Scan for Hosts
              </>}
          </Button>
          <Button onClick={() => setAddHostDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Host Manually
          </Button>
        </div>
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
            />
          ))}
          
          <Card className="border-2 border-dashed bg-muted/50 hover:bg-muted/80 transition-colors">
            <CardContent className="p-6 h-full flex flex-col items-center justify-center text-center space-y-5">
              <div className="rounded-full bg-primary/10 p-4">
                <ServerCog className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Add New Host</h3>
                <p className="text-muted-foreground">
                  Scan your network for hosts or manually add host connections
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-2">
                <Button onClick={handleScanForHosts} disabled={isScanning} variant="outline" className="gap-2">
                  {isScanning ? <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Scanning...
                    </> : <>
                      <ScanLine className="h-4 w-4" />
                      Scan for Hosts
                    </>}
                </Button>
                <Button onClick={() => setAddHostDialogOpen(true)} className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Add Host Manually
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {isScanning && <div className="border rounded-lg overflow-hidden shadow-sm h-[400px]">
              <div className="bg-muted/50 p-6 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-20 w-full" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-1/2" />
                    <Skeleton className="h-9 w-1/2" />
                  </div>
                </div>
              </div>
            </div>}
        </div>
      ) : (
        searchQuery && <NoSearchResults query={searchQuery} onClear={clearSearch} />
      )}
      
      <ConfigFileDialog open={configDialog.isOpen} onOpenChange={setDialogOpen} configPath={configDialog.configPath} initialConfig={configDialog.configContent} onSave={handleUpdateConfig} profileEndpoint={configDialog.profileEndpoint} needsUpdate={configDialog.needsUpdate} allowPathEdit={configDialog.allowPathEdit} isViewOnly={configDialog.isViewOnly} isFixMode={configDialog.isFixMode} isUpdateMode={configDialog.isUpdateMode} isCreateMode={configDialog.isCreateMode} />
      
      <AddHostDialog open={addHostDialogOpen} onOpenChange={setAddHostDialogOpen} onAddHost={handleAddHost} />
      
      <AddServerToHostDialog
        open={addServerDialogOpen}
        onOpenChange={setAddServerDialogOpen}
        onAddServers={handleAddServers}
      />
    </div>
  );
};

export default Hosts;
