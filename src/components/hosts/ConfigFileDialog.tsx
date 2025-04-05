
import { useState, useEffect, useRef } from "react";
import { Save, AlertTriangle, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ConfigFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configPath: string;
  initialConfig: string;
  onSave: (config: string) => void;
  profileEndpoint?: string;
}

export function ConfigFileDialog({
  open,
  onOpenChange,
  configPath,
  initialConfig,
  onSave,
  profileEndpoint
}: ConfigFileDialogProps) {
  const [config, setConfig] = useState(initialConfig);
  const [error, setError] = useState<string | null>(null);
  const [isModified, setIsModified] = useState(false);
  const [hasEndpointMismatch, setHasEndpointMismatch] = useState(false);
  const [originalConfig, setOriginalConfig] = useState(initialConfig);
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Update config when initialConfig changes
  useEffect(() => {
    setConfig(initialConfig);
    setOriginalConfig(initialConfig);
    setIsModified(false);
  }, [initialConfig, open]);

  // Check if the config has an endpoint that doesn't match the profile's endpoint
  useEffect(() => {
    if (profileEndpoint && config) {
      try {
        const parsedConfig = JSON.parse(config);
        
        // Check for endpoint mismatch in mcpnow configuration
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
        // Silently fail, validation error will be shown separately
      }
    }
  }, [config, profileEndpoint]);

  const handleSave = () => {
    try {
      // Validate JSON format
      JSON.parse(config);

      // Check for endpoint mismatch before saving
      if (hasEndpointMismatch) {
        setError("Cannot save: The endpoint in the mcpnow configuration doesn't match the selected profile's endpoint.");
        return;
      }
      
      setError(null);
      onSave(config);
      
      toast({
        title: "Configuration saved",
        description: `Config file saved to ${configPath}`,
      });
      
      setIsModified(false);
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

  const resetJson = () => {
    try {
      // Generate default mcpnow config
      if (profileEndpoint) {
        const parsedConfig = JSON.parse(config);
        
        // Create or update mcpnow configuration
        if (!parsedConfig.mcpServers) {
          parsedConfig.mcpServers = {};
        }
        
        parsedConfig.mcpServers.mcpnow = {
          command: "npx",
          args: [
            "-y",
            "@modelcontextprotocol/mcpnow",
            profileEndpoint
          ]
        };
        
        const formattedConfig = JSON.stringify(parsedConfig, null, 2);
        setConfig(formattedConfig);
        setIsModified(true);
        setHasEndpointMismatch(false);
        setError(null);
      } else {
        // Reset to original state if no profile endpoint
        setConfig(originalConfig);
        setIsModified(false);
        setError(null);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(`Cannot reset: ${err.message}`);
      } else {
        setError("Cannot reset: Invalid JSON");
      }
    }
  };

  // Apply syntax highlighting for mcpnow section
  useEffect(() => {
    if (!textareaRef.current) return;
    
    try {
      // Implementation for highlighting would typically be more complex with a proper editor
      // Since we're using a textarea, we'll just focus on finding the mcpnow section
      const parsedConfig = JSON.parse(config);
      if (parsedConfig.mcpServers?.mcpnow) {
        // For a textarea, we can't apply direct highlighting
        // In a real implementation, consider using a code editor component like Monaco, CodeMirror, etc.
      }
    } catch (e) {
      // Silently fail, validation error will be shown separately
    }
  }, [config]);

  // Handle dialog close with unsaved changes
  const handleCloseDialog = (open: boolean) => {
    if (!open && isModified) {
      if (window.confirm("You have unsaved changes. Are you sure you want to close?")) {
        onOpenChange(false);
      }
    } else {
      onOpenChange(open);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleCloseDialog}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Config File</DialogTitle>
          <DialogDescription>
            {configPath}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 min-h-[400px] flex flex-col space-y-3 mt-2">
          <div className="flex justify-between mb-2">
            <div className="text-sm text-muted-foreground">
              Edit the configuration below. <span className="font-medium text-primary">The mcpnow section is important and must match your profile.</span>
            </div>
            <Button variant="outline" size="sm" onClick={resetJson}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset JSON
            </Button>
          </div>
          
          {hasEndpointMismatch && (
            <Alert variant="destructive" className="py-2 px-3">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Warning: The endpoint in the mcpnow configuration does not match the selected profile's endpoint.
                Click "Reset JSON" to fix this issue.
              </AlertDescription>
            </Alert>
          )}
          
          <ScrollArea className="h-[400px] border rounded-md">
            <Textarea 
              ref={textareaRef}
              className="flex-1 font-mono text-sm min-h-[400px] border-0 resize-none"
              value={config} 
              onChange={(e) => handleChange(e.target.value)}
              spellCheck={false}
            />
          </ScrollArea>
          
          {error && (
            <div className="text-destructive text-sm bg-destructive/10 p-2 rounded border border-destructive/20">
              {error}
            </div>
          )}
        </div>
        
        <DialogFooter className="flex justify-end space-x-2">
          <Button onClick={handleSave} disabled={!!error}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
