
import { useEffect, useRef, useState } from "react";
import { 
  Calendar,
  Check,
  CheckCircle,
  ChevronLeft,
  Clock,
  Download, 
  Eye,
  ExternalLink,
  FolderOpen,
  Globe,
  Link2, 
  Loader2,
  Search,
  Tag,
  Users,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EndpointLabel } from "@/components/status/EndpointLabel";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { discoveryItems, ServerDefinition } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { CategoryList } from "@/components/discovery/CategoryList";
import { OfficialBadge } from "@/components/discovery/OfficialBadge";
import { EmptyState } from "@/components/discovery/EmptyState";
import { LoadingIndicator } from "@/components/discovery/LoadingIndicator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { StatusIndicator } from "@/components/status/StatusIndicator";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ITEMS_PER_PAGE = 12; // Increased to show more items initially

// Extended to have more variety in the data for presentation
interface EnhancedServerDefinition extends ServerDefinition {
  views?: number;
  forks?: number;
  watches?: number;
  updated?: string;
  trending?: boolean;
  author?: string;
}

const extendedItems: EnhancedServerDefinition[] = [
  ...discoveryItems.map(item => ({
    ...item,
    views: Math.floor(Math.random() * 50000) + 1000,
    updated: "2025-03-15",
    author: item.author || "API Team"
  })),
  // Add trending items with higher view counts and recent updates
  ...discoveryItems.map((item, index) => ({
    ...item,
    id: `trending-${item.id}-${index}`,
    name: `${item.name} API`,
    views: Math.floor(Math.random() * 1000000) + 50000,
    updated: "2025-04-03",
    isOfficial: true,
    trending: true,
    forks: Math.floor(Math.random() * 100) + 30,
    watches: Math.floor(Math.random() * 1000) + 200,
    author: item.author || "API Team"
  })),
  // Add community items with varied statistics
  ...discoveryItems.map((item, index) => ({
    ...item,
    id: `community-${item.id}-${index}`,
    name: `${item.name} Community`,
    isOfficial: false,
    views: Math.floor(Math.random() * 50000) + 1000,
    updated: "2025-02-15",
    author: "Community Contributor",
    categories: [...(item.categories || []), "Community"]
  }))
];

const mockCategories = [
  "API Testing", 
  "Developer Tools", 
  "Database", 
  "DevOps", 
  "Monitoring", 
  "Cloud", 
  "Security", 
  "Analytics", 
  "Productivity",
  "Automation"
];

const Discovery = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedServer, setSelectedServer] = useState<EnhancedServerDefinition | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isInstalling, setIsInstalling] = useState<Record<string, boolean>>({});
  const [installedServers, setInstalledServers] = useState<Record<string, boolean>>({});
  const [visibleItems, setVisibleItems] = useState(ITEMS_PER_PAGE);
  const [isLoading, setIsLoading] = useState(false);
  const [allCategories, setAllCategories] = useState<string[]>(mockCategories);
  const [sortOption, setSortOption] = useState("popular");
  const [installedButtonHover, setInstalledButtonHover] = useState<Record<string, boolean>>({});
  
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleItems(ITEMS_PER_PAGE);
  }, [searchQuery, selectedCategory, activeTab]);

  // Filter and sort servers based on user selections
  const getFilteredServers = () => {
    let filtered = extendedItems.filter(server => 
      (searchQuery === "" || 
        server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        server.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (server.author && server.author.toLowerCase().includes(searchQuery.toLowerCase()))
      ) && 
      (selectedCategory === null || 
        server.categories?.includes(selectedCategory)
      )
    );

    // Filter by tab selection
    if (activeTab === "official") {
      filtered = filtered.filter(server => server.isOfficial);
    } else if (activeTab === "community") {
      filtered = filtered.filter(server => !server.isOfficial);
    }
    // No filtering for "all" tab

    // Sort based on selected option
    if (sortOption === "popular") {
      filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (sortOption === "recent") {
      filtered.sort((a, b) => {
        const dateA = a.updated ? new Date(a.updated).getTime() : 0;
        const dateB = b.updated ? new Date(b.updated).getTime() : 0;
        return dateB - dateA;
      });
    } else if (sortOption === "forks") {
      filtered.sort((a, b) => (b.forks || 0) - (a.forks || 0));
    }

    return filtered;
  };

  const filteredServers = getFilteredServers();
  const visibleServers = filteredServers.slice(0, visibleItems);
  const hasMore = visibleServers.length < filteredServers.length;

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading) {
          loadMoreItems();
        }
      },
      { rootMargin: "200px" }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [visibleItems, filteredServers.length, isLoading]);

  const loadMoreItems = () => {
    if (!hasMore) return;
    
    setIsLoading(true);
    
    setTimeout(() => {
      setVisibleItems(prev => prev + ITEMS_PER_PAGE);
      setIsLoading(false);
    }, 800);
  };

  const handleViewDetails = (server: EnhancedServerDefinition) => {
    setSelectedServer(server);
    setIsDialogOpen(true);
  };

  const handleInstall = (serverId: string) => {
    const server = extendedItems.find(item => item.id === serverId);
    if (!server) return;
    
    setIsInstalling(prev => ({ ...prev, [serverId]: true }));
    
    setTimeout(() => {
      setIsInstalling(prev => ({ ...prev, [serverId]: false }));
      setInstalledServers(prev => ({ ...prev, [serverId]: true }));
      
      toast({
        title: "Server installed",
        description: `${server.name} has been successfully installed.`,
      });
    }, 1500);
  };

  const handleNavigateToServers = () => {
    navigate("/servers");
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <div className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-8 text-white relative overflow-hidden">
        <div className="max-w-3xl relative z-10">
          <h1 className="text-3xl font-bold mb-2">Trending Server Definitions</h1>
          <p className="text-blue-100 mb-6">
            Discover server definitions created by the community. Find what's popular,
            trending, and recently updated to enhance your development workflow.
          </p>
          
          <div className="flex gap-4">
            <Button 
              variant="default"
              className="bg-white text-blue-700 hover:bg-blue-50"
              onClick={() => navigate("/servers")}
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              My Servers
            </Button>
          </div>
        </div>
        
        {/* Abstract decoration */}
        <div className="absolute right-8 top-1/2 transform -translate-y-1/2 opacity-10">
          <div className="w-64 h-64 rounded-full border-4 border-white absolute -right-16 -top-16"></div>
          <div className="w-32 h-32 rounded-full border-4 border-white absolute right-24 top-8"></div>
          <div className="w-48 h-48 rounded-full border-4 border-white absolute -right-8 top-16"></div>
        </div>
      </div>
      
      {/* Filters Section */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-[280px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search servers, APIs, collections..."
                className="pl-10 bg-background border-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="recent">Recently Updated</SelectItem>
                <SelectItem value="forks">Most Forked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Tabs 
          defaultValue="all" 
          className="w-full" 
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <div className="flex justify-between items-center border-b pb-1">
            <TabsList className="bg-transparent p-0 h-9">
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none px-3"
              >
                All
              </TabsTrigger>
              <TabsTrigger 
                value="official"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none px-3"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Official
              </TabsTrigger>
              <TabsTrigger 
                value="community"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none px-3"
              >
                <Users className="h-4 w-4 mr-1" />
                Community
              </TabsTrigger>
            </TabsList>
            
            {selectedCategory && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-xs"
                onClick={() => setSelectedCategory(null)}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Clear filters
              </Button>
            )}
          </div>
        </Tabs>
        
        {/* Category chips */}
        <div className="flex flex-wrap gap-2">
          {allCategories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              className={`
                rounded-full text-xs px-3 h-7
                ${selectedCategory === category ? 'bg-blue-600 text-white' : 'bg-transparent'}
              `}
              onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
            >
              <Tag className="h-3 w-3 mr-1" />
              {category}
            </Button>
          ))}
        </div>
      </div>
      
      <ScrollArea className="h-[calc(100vh-380px)]">
        {filteredServers.length > 0 ? (
          <>
            <div className="grid gap-5 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-4">
              {visibleServers.map(server => (
                <Card 
                  key={server.id} 
                  className="flex flex-col overflow-hidden hover:shadow-md transition-shadow duration-200 border border-gray-200 dark:border-gray-800"
                >
                  <CardHeader className="pb-2 space-y-0 px-5 pt-5">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <div className="flex flex-col">
                        <CardTitle 
                          className="text-lg font-semibold hover:text-blue-600 transition-colors cursor-pointer"
                          onClick={() => handleViewDetails(server)}
                        >
                          {server.name}
                        </CardTitle>
                        <div className="flex items-center gap-1.5 mt-1">
                          <EndpointLabel type={server.type} />
                          {server.isOfficial && <OfficialBadge />}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        {server.watches && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            {formatNumber(server.watches)}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="px-5 py-2 flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {server.description}
                    </p>
                  </CardContent>
                  
                  <CardFooter className="px-5 py-4 border-t flex justify-between bg-gray-50 dark:bg-gray-900">
                    <div className="flex items-center text-xs text-muted-foreground">
                      {server.author && (
                        <>
                          <StatusIndicator status="verified" size="sm" />
                          <span className="ml-1 font-medium">{server.author}</span>
                          <Separator orientation="vertical" className="h-3 mx-2" />
                        </>
                      )}
                      
                      {server.updated && (
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1 text-gray-400" />
                          <span>Updated {getTimeAgo(server.updated)}</span>
                        </div>
                      )}
                    </div>
                    
                    {installedServers[server.id] ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={`
                          h-8
                          ${installedButtonHover[server.id] ? 
                            "text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100" : 
                            "text-green-600 bg-green-50 border-green-200 hover:bg-green-100"}
                        `}
                        onClick={handleNavigateToServers}
                        onMouseEnter={() => setInstalledButtonHover(prev => ({ ...prev, [server.id]: true }))}
                        onMouseLeave={() => setInstalledButtonHover(prev => ({ ...prev, [server.id]: false }))}
                      >
                        {installedButtonHover[server.id] ? (
                          <>
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Check
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            Installed
                          </>
                        )}
                      </Button>
                    ) : isInstalling[server.id] ? (
                      <Button variant="outline" size="sm" disabled className="bg-blue-50 text-blue-600 border-blue-200 h-8">
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        Installing...
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        onClick={() => handleInstall(server.id)}
                        className="bg-blue-600 hover:bg-blue-700 h-8"
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        Install
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            {hasMore && (
              <div ref={loadMoreRef} className="py-6 flex justify-center">
                {isLoading ? (
                  <LoadingIndicator />
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={loadMoreItems}
                    className="min-w-[200px]"
                  >
                    Load More
                  </Button>
                )}
              </div>
            )}
          </>
        ) : (
          <EmptyState 
            searchQuery={searchQuery} 
            onReset={() => {
              setSearchQuery("");
              setSelectedCategory(null);
            }} 
          />
        )}
      </ScrollArea>
      
      {/* Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white dark:bg-gray-900">
          {selectedServer && (
            <div className="h-full">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 pb-4 text-white">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <DialogTitle className="text-2xl font-bold leading-tight text-white">
                      {selectedServer.name}
                    </DialogTitle>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <EndpointLabel type={selectedServer.type} />
                      {selectedServer.isOfficial && <OfficialBadge />}
                      
                      <div className="flex items-center text-blue-100 text-sm">
                        <Eye className="h-4 w-4 mr-1" />
                        {formatNumber(selectedServer.views || 0)} views
                      </div>
                      
                      {selectedServer.forks && (
                        <div className="flex items-center text-blue-100 text-sm">
                          <Users className="h-4 w-4 mr-1" />
                          {formatNumber(selectedServer.forks)} forks
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DialogClose className="rounded-full p-1 hover:bg-white/20 transition-colors">
                      <X className="h-5 w-5" />
                    </DialogClose>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-base font-semibold mb-2 text-gray-800 dark:text-gray-200">
                        Description
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        {selectedServer.description}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-base font-semibold mb-2 text-gray-800 dark:text-gray-200">
                        Features
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
                        {selectedServer.features?.map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="text-base font-semibold mb-2 text-gray-800 dark:text-gray-200">
                        Categories
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedServer.categories?.map(category => (
                          <Badge 
                            key={category} 
                            variant="outline" 
                            className="bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300"
                          >
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Author</h3>
                        <div className="flex items-center">
                          <StatusIndicator status="verified" />
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {selectedServer.author || `${selectedServer.name.split(' ')[0]} Team`}
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Version</h3>
                        <p className="font-medium text-gray-800 dark:text-gray-200">
                          {selectedServer.version || (Math.random() > 0.5 ? '1.5.0' : '0.9.5')}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Last Updated</h3>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-gray-800 dark:text-gray-200">
                            {selectedServer.updated ? new Date(selectedServer.updated).toLocaleDateString() : 'April 3, 2025'}
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Repository</h3>
                        <a 
                          href="#" 
                          className="text-blue-600 flex items-center hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Globe className="h-4 w-4 mr-1" />
                          {selectedServer.repository || `github.com/${selectedServer.name.toLowerCase().replace(/\s+/g, '-')}`}
                          <ExternalLink className="h-3.5 w-3.5 ml-1" />
                        </a>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Usage Statistics</h3>
                      
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-white dark:bg-gray-900 rounded-lg p-3">
                          <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                            {formatNumber(selectedServer.views || 1320)}
                          </div>
                          <div className="text-xs text-gray-500">Views</div>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-900 rounded-lg p-3">
                          <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                            {formatNumber(selectedServer.forks || 48)}
                          </div>
                          <div className="text-xs text-gray-500">Forks</div>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-900 rounded-lg p-3">
                          <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                            {formatNumber(selectedServer.watches || 215)}
                          </div>
                          <div className="text-xs text-gray-500">Watches</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end p-4 border-t gap-2 bg-gray-50 dark:bg-gray-800/50">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Close
                </Button>
                
                {installedServers[selectedServer.id] ? (
                  <Button 
                    variant="outline" 
                    className={`
                      ${installedButtonHover[selectedServer.id] ?
                        "text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100" :
                        "text-green-600 bg-green-50 border-green-200 hover:bg-green-100"
                      }
                    `}
                    onClick={handleNavigateToServers}
                    onMouseEnter={() => setInstalledButtonHover(prev => ({ ...prev, [selectedServer.id]: true }))}
                    onMouseLeave={() => setInstalledButtonHover(prev => ({ ...prev, [selectedServer.id]: false }))}
                  >
                    {installedButtonHover[selectedServer.id] ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Check
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Installed
                      </>
                    )}
                  </Button>
                ) : isInstalling[selectedServer.id] ? (
                  <Button disabled className="bg-blue-50 text-blue-600 border-blue-200">
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Installing...
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleInstall(selectedServer.id)} 
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Install Server
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Discovery;
