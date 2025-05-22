
export interface ServerDefinition {
  id: string;
  name: string;
  type: ConnectionType | ConnectionType[];  // Now can be multiple types
  version: string;
  description: string;
  icon?: string;
  downloads: number;
  stars?: number;
  author?: string;
  categories?: string[];
  isOfficial?: boolean;
  features?: string[];
  repository?: string;
  url?: string;
  commandArgs?: string;
  environment?: Record<string, string>;
  headers?: Record<string, string>;
  tools?: Tool[];
  hostingSupported?: boolean;  // Whether this server can be hosted
  connectionSubtypes?: {
    [key in ConnectionType]?: SubConnectionType[];
  };
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  parameters?: ToolParameter[];
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required?: boolean;
  default?: any;
}

export interface ServerInstance {
  id: string;
  name: string;
  definitionId: string;
  status: 'running' | 'stopped' | 'connecting' | 'error';
  connectionDetails: string;
  requestCount?: number;
  environment?: Record<string, string>;
  arguments?: string[];
  url?: string;
  headers?: Record<string, string>;
  enabled: boolean;
  connectionType?: ConnectionType;  // Used when a server supports multiple types
  connectionSubtype?: SubConnectionType;  // The specific subtype being used
  isHosted?: boolean;  // Whether this instance is hosted
}

export type ConnectionType = 'HTTP_SSE' | 'STDIO';
export type SubConnectionType = 'docker' | 'npx' | 'uvx' | 'sse' | 'streamable';
export type EndpointType = ConnectionType;

export const serverDefinitions: ServerDefinition[];
export const serverInstances: ServerInstance[];

export interface Profile {
  id: string;
  name: string;
  endpointType: EndpointType;
  enabled: boolean;
  endpoint: string;
  instances: string[];
  description?: string;
}

export const profiles: Profile[];

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

export interface Host {
  id: string;
  name: string;
  icon?: string;
  connectionStatus: ConnectionStatus;
  configStatus: 'configured' | 'misconfigured' | 'unknown';
  configPath?: string;
}

export const hosts: Host[];
