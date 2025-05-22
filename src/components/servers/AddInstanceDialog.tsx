import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Info, Plus, Trash2, X, Server } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ServerDefinition, ConnectionType, SubConnectionType } from "@/data/mockData";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EndpointLabel } from "@/components/status/EndpointLabel";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface AddInstanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverDefinition: ServerDefinition | null;
  onCreateInstance: (data: InstanceFormValues) => void;
  editMode?: boolean;
  initialValues?: InstanceFormValues;
  instanceId?: string;
}

// Helper function to get a readable display name for subtypes
const getSubtypeDisplayName = (subtype: SubConnectionType): string => {
  switch (subtype) {
    case 'docker': return 'Docker';
    case 'npx': return 'NPX';
    case 'uvx': return 'UVX';
    case 'sse': return 'SSE';
    case 'streamable': return 'Streamable';
    default: return subtype;
  }
};

const instanceFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  connectionType: z.enum(["HTTP_SSE", "STDIO"]),
  connectionSubtype: z.enum(["docker", "npx", "uvx", "sse", "streamable"]).optional(),
  args: z.string().optional(),
  url: z.string().optional(),
  env: z.record(z.string(), z.string()).optional(),
  headers: z.record(z.string(), z.string()).optional(),
  instanceId: z.string().optional(),
  isHosted: z.boolean().default(false),
});

export type InstanceFormValues = z.infer<typeof instanceFormSchema>;

export function AddInstanceDialog({ 
  open, 
  onOpenChange, 
  serverDefinition, 
  onCreateInstance,
  editMode = false,
  initialValues,
  instanceId
}: AddInstanceDialogProps) {
  // For STDIO type
  const [envFields, setEnvFields] = useState<{name: string; value: string}[]>([]);
  
  // For HTTP_SSE type
  const [headerFields, setHeaderFields] = useState<{name: string; value: string}[]>([]);

  // For info box visibility
  const [showInfoBox, setShowInfoBox] = useState<boolean>(true);
  
  // For connection type and subtype
  const [availableConnectionTypes, setAvailableConnectionTypes] = useState<ConnectionType[]>([]);
  const [availableSubtypes, setAvailableSubtypes] = useState<SubConnectionType[]>([]);

  const form = useForm<InstanceFormValues>({
    resolver: zodResolver(instanceFormSchema),
    defaultValues: {
      name: '',
      connectionType: 'HTTP_SSE',
      connectionSubtype: undefined,
      args: '',
      url: '',
      env: {},
      headers: {},
      instanceId: instanceId,
      isHosted: false,
    },
  });

  const connectionType = form.watch("connectionType") as ConnectionType;
  const isHosted = form.watch("isHosted");
  
  // Effect to reset form when dialog opens
  useEffect(() => {
    if (open && serverDefinition) {
      // Determine available connection types
      const types = Array.isArray(serverDefinition.type) 
        ? serverDefinition.type 
        : [serverDefinition.type];
      setAvailableConnectionTypes(types);
      
      // Set initial connection type
      const initialType = initialValues?.connectionType || types[0];
      form.setValue("connectionType", initialType);
      
      // Initialize the form with proper defaults based on server definition
      form.reset({
        name: initialValues?.name || (serverDefinition ? `${serverDefinition.name} Instance` : ""),
        connectionType: initialType,
        connectionSubtype: initialValues?.connectionSubtype,
        args: initialValues?.args || (initialType === 'STDIO' ? 
          serverDefinition?.commandArgs || `npx -y @smithery/cli@latest install @block/${serverDefinition?.type.toLowerCase()} --client ${serverDefinition?.name?.toLowerCase()} --key ad3dda05-c241-44f6-bcb8-283ef9149d88` 
          : ""),
        url: initialValues?.url || (initialType === 'HTTP_SSE' ? serverDefinition?.url || "http://localhost:3000/api" : ""),
        env: initialValues?.env || {},
        headers: initialValues?.headers || {},
        instanceId: instanceId,
        isHosted: initialValues?.isHosted || false,
      });
      
      // Initialize env fields based on initialValues if in edit mode
      if (editMode && initialValues?.env) {
        const envEntries = Object.entries(initialValues.env);
        setEnvFields(envEntries.map(([name, value]) => ({ name, value: value.toString() })));
      } else if (initialType === 'STDIO') {
        // Set default env fields for new STDIO instance based on server definition
        if (serverDefinition.environment && Object.keys(serverDefinition.environment).length > 0) {
          setEnvFields(Object.entries(serverDefinition.environment).map(([name, value]) => ({ name, value: value.toString() })));
        } else {
          // Default env fields if no server definition environment
          setEnvFields([
            { name: "API_KEY", value: "" },
            { name: "MODEL_NAME", value: "" },
            { name: "MAX_TOKENS", value: "4096" },
          ]);
        }
      }
      
      // Initialize header fields based on initialValues if in edit mode
      if (editMode && initialValues?.headers) {
        const headerEntries = Object.entries(initialValues.headers);
        setHeaderFields(headerEntries.map(([name, value]) => ({ name, value: value.toString() })));
      } else if (initialType === 'HTTP_SSE') {
        // Set default header fields for new HTTP_SSE instance based on server definition
        if (serverDefinition.headers && Object.keys(serverDefinition.headers).length > 0) {
          setHeaderFields(Object.entries(serverDefinition.headers).map(([name, value]) => ({ name, value: value.toString() })));
        } else {
          // Default header fields if no server definition headers
          setHeaderFields([
            { name: "Authorization", value: "" },
            { name: "Content-Type", value: "application/json" },
          ]);
        }
      }
      
      // Reset info box visibility
      setShowInfoBox(true);
    }
  }, [open, initialValues, serverDefinition, form, editMode, instanceId]);
  
  // Update available subtypes when connection type changes
  useEffect(() => {
    if (serverDefinition?.connectionSubtypes?.[connectionType]) {
      const subtypes = serverDefinition.connectionSubtypes[connectionType] || [];
      setAvailableSubtypes(subtypes);
      
      // Set default subtype if available
      const currentSubtype = form.getValues("connectionSubtype");
      if (!currentSubtype || !subtypes.includes(currentSubtype as SubConnectionType)) {
        form.setValue("connectionSubtype", subtypes[0]);
      }
    } else {
      // Set default subtypes based on connection type
      const defaultSubtypes: Record<ConnectionType, SubConnectionType[]> = {
        'STDIO': ['npx'],
        'HTTP_SSE': ['sse']
      };
      setAvailableSubtypes(defaultSubtypes[connectionType] || []);
      form.setValue("connectionSubtype", defaultSubtypes[connectionType]?.[0]);
    }
  }, [connectionType, serverDefinition, form]);

  const onSubmit = (data: InstanceFormValues) => {
    // Process environment variables for STDIO type
    if (data.connectionType === 'STDIO') {
      const envData: Record<string, string> = {};
      
      envFields.forEach(field => {
        if (field.name && field.value) {
          envData[field.name] = field.value;
        }
      });
      
      data.env = envData;
    }
    
    // Process HTTP headers for HTTP_SSE type
    if (data.connectionType === 'HTTP_SSE') {
      const headerData: Record<string, string> = {};
      
      headerFields.forEach(field => {
        if (field.name && field.value) {
          headerData[field.name] = field.value;
        }
      });
      
      data.headers = headerData;
    }
    
    data.instanceId = instanceId; 
    onCreateInstance(data);
    if (!editMode) form.reset();
  };

  const addEnvField = () => {
    setEnvFields([...envFields, { name: "", value: "" }]);
  };

  const addHeaderField = () => {
    setHeaderFields([...headerFields, { name: "", value: "" }]);
  };
  
  const removeEnvField = (index: number) => {
    // Allow removing any field now
    const newFields = [...envFields];
    newFields.splice(index, 1);
    setEnvFields(newFields);
  };

  const removeHeaderField = (index: number) => {
    // Allow removing any field now
    const newFields = [...headerFields];
    newFields.splice(index, 1);
    setHeaderFields(newFields);
  };

  if (!serverDefinition) return null;

  const isStdio = connectionType === 'STDIO';
  const isCustom = !serverDefinition.isOfficial;
  const supportsHosting = serverDefinition.hostingSupported;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{editMode ? "Edit Instance" : serverDefinition.name}</span>
            {Array.isArray(serverDefinition.type) ? (
              <div className="flex gap-1.5">
                {serverDefinition.type.map(type => (
                  <EndpointLabel key={type} type={type} />
                ))}
              </div>
            ) : (
              <EndpointLabel type={serverDefinition.type} />
            )}
            {isCustom && (
              <Badge variant="outline" className="text-gray-600 border-gray-300 rounded-md">
                Custom
              </Badge>
            )}
            {supportsHosting && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 rounded-md flex items-center gap-1">
                <Server className="w-3 h-3" />
                Hostable
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {editMode ? "Edit the instance settings" : serverDefinition.description}
          </DialogDescription>
        </DialogHeader>
        
        {/* What is an Instance explanation box */}
        {!editMode && showInfoBox && (
          <Alert className="bg-blue-50 dark:bg-blue-950/30 rounded-md p-4 border border-blue-100 dark:border-blue-900 mb-4 relative">
            <div className="flex gap-2 items-center">
              <Info className="h-4 w-4 text-blue-500" />
              <h3 className="font-medium text-blue-800 dark:text-blue-300">
                What is an Instance?
              </h3>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 h-6 w-6 p-1 text-blue-600"
              onClick={() => setShowInfoBox(false)}
            >
              <X className="h-3 w-3" />
            </Button>
            <AlertDescription className="mt-2 text-sm text-blue-700 dark:text-blue-400">
              An instance is a running copy of a server with specific configuration settings. 
              You can create multiple instances of the same server type with different settings 
              to serve different purposes or environments.
            </AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    Instance Name
                    <span className="text-destructive ml-1">*</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="ml-1 cursor-help">
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>A unique name to identify this server instance</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="My Server Instance" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              {availableConnectionTypes.length > 1 && (
                <FormField
                  control={form.control}
                  name="connectionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        Connection Type
                        <span className="text-destructive ml-1">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={(value) => form.setValue("connectionType", value as ConnectionType)}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select connection type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableConnectionTypes.map(type => (
                            <SelectItem key={type} value={type}>
                              {type === 'HTTP_SSE' ? 'HTTP SSE' : type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {availableSubtypes.length > 0 && (
                <FormField
                  control={form.control}
                  name="connectionSubtype"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        Connection Subtype
                        <span className="text-destructive ml-1">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={(value) => form.setValue("connectionSubtype", value as SubConnectionType)}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subtype" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableSubtypes.map(subtype => (
                            <SelectItem key={subtype} value={subtype}>
                              {getSubtypeDisplayName(subtype)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            {supportsHosting && (
              <FormField
                control={form.control}
                name="isHosted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="flex items-center">
                        Enable Hosting
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 ml-2 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">When hosting is enabled, the server will be run on the host instead of locally</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Use managed hosting for this server instance
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            )}
            
            {isStdio ? (
              // STDIO specific fields
              <>
                {!isHosted && (
                  <FormField
                    control={form.control}
                    name="args"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          Command Arguments
                          <span className="text-destructive ml-1">*</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="ml-1 cursor-help">
                                  <Info className="h-4 w-4 text-muted-foreground" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Command line arguments to initialize the server</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="npx -y @smithery/cli@latest install @block/server-type" 
                            className="font-mono text-sm h-20" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium flex items-center">
                      Environment Variables
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="ml-1 cursor-help">
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>These variables will be passed to the server instance</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addEnvField}
                      className="flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Variable
                    </Button>
                  </div>
                  
                  <div className="space-y-4 max-h-[200px] overflow-y-auto border rounded-md p-4">
                    {envFields.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No environment variables defined. Click 'Add Variable' to add one.
                      </p>
                    ) : (
                      envFields.map((field, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-start">
                          <div className="col-span-5">
                            <Input
                              value={field.name}
                              onChange={(e) => {
                                const newFields = [...envFields];
                                newFields[index].name = e.target.value;
                                setEnvFields(newFields);
                              }}
                              placeholder="Variable Name"
                              className="text-sm"
                            />
                          </div>
                          <div className="col-span-6">
                            <Input
                              value={field.value}
                              onChange={(e) => {
                                const newFields = [...envFields];
                                newFields[index].value = e.target.value;
                                setEnvFields(newFields);
                              }}
                              placeholder="Value"
                              className="text-sm"
                            />
                          </div>
                          <div className="col-span-1 flex justify-center items-center h-full">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-destructive"
                              onClick={() => removeEnvField(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : (
              // HTTP_SSE specific fields
              <>
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        URL
                        <span className="text-destructive ml-1">*</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="ml-1 cursor-help">
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>The URL endpoint for the HTTP SSE server</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="http://localhost:3000/api" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium flex items-center">
                      HTTP Headers
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="ml-1 cursor-help">
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Headers to send with requests to the server</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addHeaderField}
                      className="flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Header
                    </Button>
                  </div>
                  
                  <div className="space-y-4 max-h-[200px] overflow-y-auto border rounded-md p-4">
                    {headerFields.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No HTTP headers defined. Click 'Add Header' to add one.
                      </p>
                    ) : (
                      headerFields.map((field, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-start">
                          <div className="col-span-5">
                            <Input
                              value={field.name}
                              onChange={(e) => {
                                const newFields = [...headerFields];
                                newFields[index].name = e.target.value;
                                setHeaderFields(newFields);
                              }}
                              placeholder="Header Name"
                              className="text-sm"
                            />
                          </div>
                          <div className="col-span-6">
                            <Input
                              value={field.value}
                              onChange={(e) => {
                                const newFields = [...headerFields];
                                newFields[index].value = e.target.value;
                                setHeaderFields(newFields);
                              }}
                              placeholder="Value"
                              className="text-sm"
                            />
                          </div>
                          <div className="col-span-1 flex justify-center items-center h-full">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-destructive"
                              onClick={() => removeHeaderField(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
            
            <DialogFooter className="flex justify-between">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => onOpenChange(false)}
              >
                Skip
              </Button>
              <div className="flex gap-2">
                <Button 
                  type="submit"
                >
                  {editMode ? "Save Changes" : "Create Instance"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
