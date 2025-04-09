
export interface ServerDefinition {
  id: string;
  name: string;
  type: 'HTTP_SSE' | 'STDIO';
  version: string;
  description: string;
  icon?: string;
  downloads: number;  // Changed from optional to required since it's being used
  stars?: number;
  author?: string;
  categories?: string[];
  isOfficial?: boolean;
  features?: string[];
  repository?: string;
}

export interface ServerInstance {
  id: string;
  name: string;
  definitionId: string;
  status: 'running' | 'stopped' | 'connecting' | 'error';
  connectionDetails: string;
  requestCount?: number;
  environment?: Record<string, string>;
  arguments?: string[];  // Keep this as string[] to match mockData.ts
  url?: string;
  headers?: Record<string, string>;
  enabled: boolean;  // Added to match usage in Servers.tsx
}

export type EndpointType = 'HTTP_SSE' | 'STDIO';

export const serverDefinitions: ServerDefinition[];
export const serverInstances: ServerInstance[];
