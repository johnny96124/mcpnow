
import { useState } from "react";
import { TabsList, TabsTrigger, Tabs, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, X, Plus, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ServerDefinition, serverDefinitions } from "@/data/mockData";
import { Separator } from "@/components/ui/separator";

interface AddServerToHostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddServers: (servers: ServerDefinition[]) => void;
}

export function AddServerToHostDialog({ open, onOpenChange, onAddServers }: AddServerToHostDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("list");
  const [selectedServers, setSelectedServers] = useState<ServerDefinition[]>([]);

  const handleServerSelect = (server: ServerDefinition) => {
    if (!selectedServers.find(s => s.id === server.id)) {
      setSelectedServers([...selectedServers, server]);
    }
  };

  const handleServerRemove = (serverId: string) => {
    setSelectedServers(selectedServers.filter(s => s.id !== serverId));
  };

  const handleAddServers = () => {
    onAddServers(selectedServers);
    setSelectedServers([]);
    onOpenChange(false);
  };

  const handleDialogClose = () => {
    setSelectedServers([]);
    setSearchQuery("");
    setSelectedTab("list");
    onOpenChange(false);
  };

  const filteredServers = serverDefinitions.filter(server => 
    server.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const collections = [
    {
      id: "core",
      name: "Core Services",
      servers: serverDefinitions.slice(0, 3)
    },
    {
      id: "data",
      name: "Data Services",
      servers: serverDefinitions.slice(3, 4)
    }
  ];

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Configure Host Services</DialogTitle>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">
              <Plus className="w-4 h-4 mr-2" />
              Service List
            </TabsTrigger>
            <TabsTrigger value="collections">
              <FolderPlus className="w-4 h-4 mr-2" />
              From Collections
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <ScrollArea className="h-[300px]">
              {filteredServers.length > 0 ? (
                <div className="space-y-2">
                  {filteredServers.map((server) => (
                    <Card key={server.id} className="cursor-pointer hover:bg-accent">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {server.icon && <span>{server.icon}</span>}
                          <div>
                            <p className="font-medium">{server.name}</p>
                            <p className="text-sm text-muted-foreground">{server.description}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleServerSelect(server)}
                          disabled={selectedServers.some(s => s.id === server.id)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <p className="text-muted-foreground">No services found</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="collections" className="mt-4">
            <ScrollArea className="h-[300px]">
              {collections.map((collection) => (
                <div key={collection.id} className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{collection.name}</h3>
                    <Badge variant="secondary">{collection.servers.length} services</Badge>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full mb-2"
                    onClick={() => {
                      const newServers = collection.servers.filter(
                        server => !selectedServers.some(s => s.id === server.id)
                      );
                      setSelectedServers([...selectedServers, ...newServers]);
                    }}
                  >
                    Add all services from this collection
                  </Button>
                  <div className="space-y-2">
                    {collection.servers.map((server) => (
                      <Card key={server.id} className="cursor-pointer hover:bg-accent">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {server.icon && <span>{server.icon}</span>}
                            <div>
                              <p className="font-medium">{server.name}</p>
                              <p className="text-sm text-muted-foreground">{server.description}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleServerSelect(server)}
                            disabled={selectedServers.some(s => s.id === server.id)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {selectedServers.length > 0 && (
          <>
            <Separator className="my-4" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Selected Services</h3>
                <Badge>{selectedServers.length}</Badge>
              </div>
              <ScrollArea className="max-h-[100px]">
                <div className="flex flex-wrap gap-2">
                  {selectedServers.map((server) => (
                    <Badge
                      key={server.id}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {server.name}
                      <button
                        onClick={() => handleServerRemove(server.id)}
                        className="ml-1 hover:bg-background/20 rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleDialogClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAddServers}
            disabled={selectedServers.length === 0}
          >
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
