import { Link } from "react-router-dom";
import { 
  Database,
  ExternalLink,
  Info,
  Loader2,
  PackagePlus,
  Server, 
  Star,
  UsersRound,
  CheckCircle,
  ArrowRight,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { profiles, hosts, serverInstances, serverDefinitions } from "@/data/mockData";
import { useState } from "react";
import { EndpointLabel } from "@/components/status/EndpointLabel";
import { OfficialBadge } from "@/components/discovery/OfficialBadge";
import { CategoryList } from "@/components/discovery/CategoryList";
import type { EndpointType, ServerDefinition } from "@/data/mockData";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useServerContext } from "@/context/ServerContext";
import { Separator } from "@/components/ui/separator";
import { AlertDialogAction } from "@/components/ui/alert-dialog";

const Dashboard = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState<ServerDefinition | null>(null);
  const [isInstalling, setIsInstalling] = useState<Record<string, boolean>>({});
  const [installedServers, setInstalledServers] = useState<Record<string, boolean>>({});
  
  const { openAddInstanceDialog } = useServerContext();
  
  // Calculate summary stats
  const activeProfiles = profiles.filter(p => p.enabled).length;
  const runningInstances = serverInstances.filter(s => s.status === 'running').length;
  const connectedHosts = hosts.filter(h => h.connectionStatus === 'connected').length;
  
  // Mock trending server data - featured first 3 servers
  const trendingServers = [
    { 
      id: "trend1", 
      name: "FastGPT Server", 
      icon: "🚀", 
      type: "HTTP_SSE" as EndpointType, 
      stars: 4.9, 
      downloads: 1320, 
      description: "High-performance GPT model server with streaming responses",
      author: "AI Systems Inc",
      version: "1.3.0",
      categories: ["AI", "LLM", "NLP"],
      isOfficial: true,
      features: [
        "High throughput streaming responses",
        "Automatic model quantization",
        "Multi-model support",
        "Custom prompt templates"
      ],
      repository: "https://github.com/ai-systems/fastgpt-server"
    },
    { 
      id: "trend2", 
      name: "CodeAssistant", 
      icon: "💻", 
      type: "STDIO" as EndpointType, 
      stars: 4.8, 
      downloads: 1320, 
      description: "Code completion and analysis server with multiple language support",
      author: "DevTools Ltd",
      version: "2.1.1",
      categories: ["Development", "AI", "Code"],
      isOfficial: true,
      features: [
        "Multi-language support",
        "Context-aware completions",
        "Semantic code search",
        "Integration with popular IDEs"
      ],
      repository: "https://github.com/devtools/code-assistant"
    },
    { 
      id: "trend3", 
      name: "SemanticSearch", 
      icon: "🔍", 
      type: "HTTP_SSE" as EndpointType, 
      stars: 4.7, 
      downloads: 1320, 
      description: "Vector database integration for semantic search capabilities",
      author: "SearchTech",
      version: "0.9.2",
      categories: ["Search", "Embeddings", "Vector DB"],
      isOfficial: false,
      features: [
        "Multiple vector DB integrations",
        "Hybrid search capabilities",
        "Custom embeddings support",
        "Query optimization"
      ],
      repository: "https://github.com/searchtech/semantic-search"
    }
  ];
  
  const handleViewDetails = (server: ServerDefinition) => {
    setSelectedServer(server);
    setIsDialogOpen(true);
  };

  const handleInstall = (serverId: string) => {
    const server = trendingServers.find(item => item.id === serverId);
    if (!server) return;
    
    setIsInstalling(prev => ({ ...prev, [serverId]: true }));
    
    // Simulate installation
    setTimeout(() => {
      setIsInstalling(prev => ({ ...prev, [serverId]: false }));
      setInstalledServers(prev => ({ ...prev, [serverId]: true }));
      
      // Open add instance dialog after installation
      openAddInstanceDialog(server);
    }, 1500);
  };

  const DialogSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-6">
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <h3 className="text-base font-medium p-4 border-b border-gray-100 dark:border-gray-700">{title}</h3>
        <div className="p-4 text-gray-600 dark:text-gray-300 text-sm">
          {children}
        </div>
      </div>
    </div>
  );
  
  const formatDownloadCount = (count: number = 1320) => {
    return `${(count / 1000).toFixed(1)}K`;
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your MCP profiles, servers, and host connections.
          </p>
        </div>
      </div>
      
      {/* Combined Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Hosts Combined Card */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-lg font-medium">
                Connected Hosts
              </CardTitle>
              <CardDescription>
                {connectedHosts} of {hosts.length} hosts connected
              </CardDescription>
            </div>
            <UsersRound className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {hosts.slice(0, 3).map(host => (
                <div 
                  key={host.id} 
                  className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{host.icon}</span>
                    <span className="font-medium">{host.name}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    host.connectionStatus === 'connected' ? 
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 
                    host.connectionStatus === 'disconnected' ? 
                    'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' :
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                  }`}>
                    {host.connectionStatus === 'connected' ? 'Connected' : 
                     host.connectionStatus === 'disconnected' ? 'Disconnected' : 
                     'Unknown'}
                  </span>
                </div>
              ))}
              {hosts.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{hosts.length - 3} more hosts
                </p>
              )}
            </div>
            <div className="flex">
              <Button asChild className="flex-1">
                <Link to="/hosts">
                  View All
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Profiles Combined Card */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-lg font-medium">
                Active Profiles
              </CardTitle>
              <CardDescription>
                {activeProfiles} of {profiles.length} profiles enabled
              </CardDescription>
            </div>
            <Database className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {profiles.slice(0, 3).map(profile => (
                <div 
                  key={profile.id} 
                  className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                >
                  <span className="font-medium">{profile.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    profile.enabled ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 
                    'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {profile.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              ))}
              {profiles.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{profiles.length - 3} more profiles
                </p>
              )}
            </div>
            <div className="flex">
              <Button asChild className="flex-1">
                <Link to="/profiles">
                  View All
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Servers Combined Card */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-lg font-medium">
                Server Instances
              </CardTitle>
              <CardDescription>
                {runningInstances} of {serverInstances.length} instances running
              </CardDescription>
            </div>
            <Server className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {serverDefinitions.slice(0, 3).map(definition => (
                <div 
                  key={definition.id} 
                  className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                >
                  <span className="font-medium">{definition.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    definition.type === 'HTTP_SSE' ? 
                    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 
                    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                  }`}>
                    {definition.type === 'HTTP_SSE' ? 'HTTP' : 'STDIO'}
                  </span>
                </div>
              ))}
              {serverDefinitions.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{serverDefinitions.length - 3} more servers
                </p>
              )}
            </div>
            <div className="flex">
              <Button asChild className="flex-1">
                <Link to="/servers">
                  View All
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Trending MCP Servers - Updated design */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Trending MCP Servers</h2>
          <Button variant="outline" size="sm" asChild className="gap-1">
            <Link to="/discovery">
              View All
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          {trendingServers.map((server) => (
            <Card key={server.id} className="overflow-hidden border-gray-200">
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold mb-2">{server.name}</h3>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <EndpointLabel type={server.type} />
                    {server.isOfficial && <OfficialBadge />}
                  </div>
                  <p className="text-muted-foreground line-clamp-2">{server.description}</p>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center text-amber-600">
                    <Download className="h-5 w-5 mr-1" />
                    <span className="font-medium">{formatDownloadCount(server.downloads)}</span>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleViewDetails(server)}
                    className="ml-auto"
                  >
                    <Info className="h-4 w-4 mr-1" /> 
                    Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Server Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedServer && (
            <>
              <DialogHeader className="border-b pb-4">
                <div className="flex justify-between items-start w-full">
                  <div>
                    <DialogTitle className="text-2xl font-bold">{selectedServer.name}</DialogTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <EndpointLabel type={selectedServer.type} />
                      {selectedServer.isOfficial && <OfficialBadge />}
                    </div>
                  </div>
                  <div className="flex items-center text-amber-600">
                    <Download className="h-5 w-5 mr-1" />
                    <span className="font-medium">{formatDownloadCount(selectedServer?.downloads)}</span>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                <DialogSection title="Description">
                  {selectedServer.description}
                </DialogSection>
                
                <div className="grid grid-cols-2 gap-6">
                  <DialogSection title="Author">
                    {selectedServer.author}
                  </DialogSection>
                  
                  <DialogSection title="Version">
                    {selectedServer.version}
                  </DialogSection>
                </div>
                
                <DialogSection title="Category">
                  <div className="flex flex-wrap gap-2">
                    {selectedServer.categories?.map(category => (
                      <Badge key={category} variant="outline" className="rounded-full">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </DialogSection>
                
                <DialogSection title="Features">
                  <ul className="list-disc list-inside space-y-2">
                    {selectedServer.features?.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </DialogSection>
                
                <DialogSection title="Repository">
                  <a 
                    href="#" 
                    className="text-primary flex items-center hover:underline"
                  >
                    {selectedServer.repository}
                    <ExternalLink className="h-3.5 w-3.5 ml-1" />
                  </a>
                </DialogSection>
              </div>
              
              <div className="flex justify-end mt-6 border-t pt-4">
                <div className="flex gap-3">
                  <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                  </DialogClose>
                  
                  {installedServers[selectedServer.id] ? (
                    <div className="flex gap-2">
                      <Button variant="outline" disabled className="text-green-600 bg-green-50">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Installed
                      </Button>
                      <Button asChild>
                        <Link to="/servers">
                          Check
                        </Link>
                      </Button>
                    </div>
                  ) : isInstalling[selectedServer.id] ? (
                    <Button disabled>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Installing...
                    </Button>
                  ) : (
                    <Button onClick={() => handleInstall(selectedServer.id)}>
                      <PackagePlus className="h-4 w-4 mr-1" />
                      Add Server
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
