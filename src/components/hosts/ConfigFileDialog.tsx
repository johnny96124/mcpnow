
import { useState, useEffect, useRef } from "react";
import { Save, AlertTriangle, RotateCw, RefreshCw, FileCode, Info, FolderOpen } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ConfigFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configPath: string;
  initialConfig: string;
  onSave: (config: string, configPath: string) => void;
  profileEndpoint?: string;
  needsUpdate?: boolean;
  allowPathEdit?: boolean;
  isViewOnly?: boolean;
  isFixMode?: boolean;
  isUpdateMode?: boolean;
  isNewHost?: boolean;
}

export function ConfigFileDialog({
  open,
  onOpenChange,
  configPath,
  initialConfig,
  onSave,
  profileEndpoint,
  needsUpdate = false,
  allowPathEdit = false,
  isViewOnly = false,
  isFixMode = false,
  isUpdateMode = false,
  isNewHost = false
}: ConfigFileDialogProps) {
  const [config, setConfig] = useState(initialConfig);
  const [path, setPath] = useState(configPath);
  const [error, setError] = useState<string | null>(null);
  const [isModified, setIsModified] = useState(false);
  const [pathModified, setPathModified] = useState(false);
  const [hasEndpointMismatch, setHasEndpointMismatch] = useState(false);
  const [originalConfig, setOriginalConfig] = useState(initialConfig);
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const configContainerRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    setConfig(initialConfig);
    setOriginalConfig(initialConfig);
    setIsModified(false);
  }, [initialConfig, open]);

  useEffect(() => {
    setPath(configPath);
    setPathModified(false);
  }, [configPath, open]);

  useEffect(() => {
    if (profileEndpoint && config) {
      try {
        const parsedConfig = JSON.parse(config);
        
        let configHasEndpoint = false;
        let configEndpoint = "";
        
        if (parsedConfig.mcpServers?.mcpnow?.args) {
          const args = parsedConfig.mcpServers.mcpnow.args;
          const endpointIndex = args.length - 1;
          if (endpointIndex >= 0) {
            configHasEndpoint = true;
            configEndpoint = args[endpointIndex];
          }
        }
        
        setHasEndpointMismatch(
          configHasEndpoint && 
          configEndpoint !== profileEndpoint &&
          configEndpoint.trim() !== ""
        );
      } catch (e) {
      }
    }
  }, [config, profileEndpoint]);

  const handleSave = () => {
    try {
      JSON.parse(config);

      if (hasEndpointMismatch) {
        setError("Cannot save: The endpoint in the mcpnow configuration doesn't match the selected profile's endpoint.");
        return;
      }
      
      setError(null);
      onSave(config, path);
      
      toast({
        title: isNewHost ? "Configuration created" : isUpdateMode ? "Configuration updated" : "Configuration saved",
        description: `Config file ${isNewHost ? "created" : isUpdateMode ? "updated" : "saved"} at ${path}`,
      });
      
      setIsModified(false);
      setPathModified(false);
      onOpenChange(false);
    } catch (err) {
      if (err instanceof Error) {
        setError(`Invalid JSON format: ${err.message}`);
      } else {
        setError("Invalid JSON format");
      }
    }
  };

  const handleChange = (value: string) => {
    setConfig(value);
    setIsModified(true);
  };

  const handlePathEdit = (value: string) => {
    setPath(value);
    setPathModified(true);
  };

  const generateDefaultConfig = () => {
    const defaultConfig = {
      mcpServers: {
        mcpnow: {
          command: "npx",
          args: [
            "-y",
            "@modelcontextprotocol/mcpnow",
            profileEndpoint || "http://localhost:8008/mcp"
          ]
        }
      }
    };
    
    return JSON.stringify(defaultConfig, null, 2);
  };

  const resetJson = () => {
    try {
      const defaultSystemConfig = generateDefaultConfig();
      setConfig(defaultSystemConfig);
      setIsModified(true);
      setHasEndpointMismatch(false);
      setError(null);
      
      toast({
        title: "Configuration reset",
        description: "The configuration has been reset to system defaults.",
      });
    } catch (err) {
      if (err instanceof Error) {
        setError(`Cannot reset: ${err.message}`);
      } else {
        setError("Cannot reset: Invalid JSON");
      }
    }
  };

  const getFormattedConfig = () => {
    try {
      const parsed = JSON.parse(config);
      
      const formatted = JSON.stringify(parsed, null, 2);
      
      return formatted;
    } catch (e) {
      return config;
    }
  };

  const handleCloseDialog = (open: boolean) => {
    if (!open && (isModified || pathModified) && !isViewOnly && !isFixMode && !isUpdateMode && !isNewHost) {
      if (window.confirm("You have unsaved changes. Are you sure you want to close?")) {
        onOpenChange(false);
      }
    } else {
      onOpenChange(open);
    }
  };

  const handleFixEndpoint = () => {
    try {
      const parsedConfig = JSON.parse(config);
      
      if (parsedConfig.mcpServers?.mcpnow?.args && profileEndpoint) {
        const args = [...parsedConfig.mcpServers.mcpnow.args];
        args[args.length - 1] = profileEndpoint;
        
        parsedConfig.mcpServers.mcpnow.args = args;
        const updatedConfig = JSON.stringify(parsedConfig, null, 2);
        
        setConfig(updatedConfig);
        setIsModified(true);
        setHasEndpointMismatch(false);
        setError(null);
        
        toast({
          title: "Endpoint updated",
          description: "The configuration endpoint has been updated to match the profile.",
        });
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(`Cannot update endpoint: ${err.message}`);
      } else {
        setError("Cannot update endpoint: Invalid JSON");
      }
    }
  };

  useEffect(() => {
    if (!configContainerRef.current) return;
    
    try {
      const container = configContainerRef.current;
      const highlightMcpNowSection = (json: string) => {
        try {
          const parsed = JSON.parse(json);
          
          let formatted = JSON.stringify(parsed, null, 2);
          
          const mcpnowRegex = /"mcpnow"\s*:\s*{(?:[^{}]|{(?:[^{}]|{[^{}]*})*})*}/gs;
          
          formatted = formatted.replace(mcpnowRegex, (match) => {
            return `<span class="mcpnow-highlight">${match}</span>`;
          });
          
          return formatted;
        } catch (e) {
          return json;
        }
      };
      
      if (isViewOnly || isFixMode || isUpdateMode || isNewHost) {
        try {
          const parsed = JSON.parse(config);
          const formatted = JSON.stringify(parsed, null, 2);
          container.innerHTML = highlightMcpNowSection(formatted);
        } catch (e) {
          container.textContent = config;
        }
      }
    } catch (e) {
    }
  }, [config, isViewOnly, isFixMode, isUpdateMode, isNewHost]);

  useEffect(() => {
    if ((isFixMode || isUpdateMode || isNewHost) && open && hasEndpointMismatch) {
      handleFixEndpoint();
    } else if ((isFixMode || isUpdateMode || isNewHost) && open && needsUpdate) {
      resetJson();
    }
  }, [isFixMode, isUpdateMode, isNewHost, open, needsUpdate]);

  let dialogTitle = isNewHost ? "New Host Configuration" : 
    isUpdateMode ? "Update Configuration" : 
    (isFixMode ? "Fix Configuration" : (isViewOnly ? "View Configuration" : "Edit Configuration"));
    
  let dialogDescription = isNewHost ? "Create a configuration file for this host" :
    isUpdateMode ? "Update your configuration to match your selected profile" :
    (isFixMode ? "Fix your configuration to match your selected profile" :
    (isViewOnly ? "View configuration file details" : "Edit configuration file details"));

  return (
    <Dialog open={open} onOpenChange={handleCloseDialog}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{dialogTitle}</DialogTitle>
            {isNewHost && <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">New Host</Badge>}
          </div>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>
        
        {isNewHost && (
          <Alert className="bg-blue-50 border-blue-200 mt-2">
            <Info className="h-4 w-4 text-blue-700" />
            <AlertTitle className="text-blue-700">New Host Found</AlertTitle>
            <AlertDescription className="text-blue-700">
              We need to create a configuration file for this host before you can use it. 
              This file will contain the settings needed to connect to the host.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex-1 flex flex-col space-y-3 mt-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="configPath" className="flex items-center gap-1">
                Configuration File Path
              </Label>
            </div>
            <Textarea
              id="configPath"
              value={path}
              onChange={(e) => handlePathEdit(e.target.value)}
              rows={1}
              className="font-mono text-sm"
              readOnly={isViewOnly || !allowPathEdit || isFixMode || isUpdateMode || isNewHost}
            />
            {allowPathEdit && !isViewOnly && !isFixMode && !isUpdateMode && !isNewHost && (
              <p className="text-xs text-muted-foreground">
                You can modify the path where this configuration will be saved.
              </p>
            )}
          </div>

          <div className="mb-2">
            <div className="flex items-center gap-2">
              <FileCode className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="configDetails" className="flex items-center gap-1">
                Configuration Details
              </Label>
            </div>
            {!isViewOnly && !isFixMode && !isUpdateMode && !isNewHost && (
              <div className="flex justify-between items-center mt-1 mb-2">
                <div className="text-sm text-muted-foreground">
                  Edit the configuration below. <span className="font-medium text-primary">The mcpnow section is important and must match your profile.</span>
                </div>
                <Button variant="outline" size="sm" onClick={resetJson}>
                  <RotateCw className="h-4 w-4 mr-2" />
                  Reset JSON
                </Button>
              </div>
            )}
          </div>
          
          <ScrollArea className="h-[300px] border rounded-md">
            {isViewOnly || isFixMode || isUpdateMode || isNewHost ? (
              <pre 
                ref={configContainerRef}
                className={cn(
                  "font-mono text-sm p-4 whitespace-pre-wrap",
                  isNewHost && "mcpnow-highlight-container"
                )}
              >
                {getFormattedConfig()}
              </pre>
            ) : (
              <Textarea 
                ref={textareaRef}
                className="flex-1 font-mono text-sm min-h-[300px] border-0 resize-none"
                value={config} 
                onChange={(e) => handleChange(e.target.value)}
                spellCheck={false}
              />
            )}
          </ScrollArea>

          {isNewHost && (
            <div className="text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <span className="p-1 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center h-5 w-5 text-xs font-bold">i</span>
                The highlighted section shows the configuration we're creating for this host
              </p>
            </div>
          )}
          
          {error && !isViewOnly && (
            <div className="text-destructive text-sm bg-destructive/10 p-2 rounded border border-destructive/20">
              {error}
            </div>
          )}
        </div>
        
        {(isFixMode || isUpdateMode) && (
          <Alert className="bg-blue-50 border-blue-200 mt-2">
            <AlertDescription className="text-blue-700">
              We'll automatically update your configuration to match the selected profile. 
              Click "{isUpdateMode ? 'Update' : 'Fix'} Configuration" when ready.
            </AlertDescription>
          </Alert>
        )}
        
        {isNewHost && (
          <Alert className="bg-blue-50 border-blue-200 mt-2">
            <AlertDescription className="text-blue-700 flex flex-col space-y-1">
              <p>This configuration will enable your host to connect with MCP-compatible applications.</p>
              <p>After creating this configuration, you'll need to select a profile to use with this host.</p>
            </AlertDescription>
          </Alert>
        )}
        
        <DialogFooter className="flex justify-end space-x-2">
          {isNewHost ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={!!error}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Create Configuration
              </Button>
            </>
          ) : isUpdateMode ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={!!error || !isModified}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Update Configuration
              </Button>
            </>
          ) : isFixMode ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!!error || !isModified}>
                Fix Configuration
              </Button>
            </>
          ) : isViewOnly ? (
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={!!error}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
