export type EndpointType = 'HTTP_SSE' | 'STDIO' | 'WS';
export type Status = 'running' | 'stopped' | 'error' | 'connecting';
export type ConnectionStatus = 'connected' | 'disconnected' | 'misconfigured' | 'unknown';
export type ConnectionType = 'HTTP_SSE' | 'STDIO' | 'WS';
export type SubConnectionType = 'docker' | 'npx' | 'uvx' | 'sse' | 'streamable';

export interface ServerDefinition {
  id: string;
  name: string;
  type: EndpointType | ConnectionType | ConnectionType[];  // Now can be multiple types
  description: string;
  author?: string;
  version?: string;
  icon?: string;
  isOfficial?: boolean;
  categories?: string[];
  features?: string[];
  repository?: string;
  downloads?: number;
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
  definitionId: string;
  name: string;
  status: Status;
  enabled: boolean;
  connectionDetails: string;
  environment?: Record<string, string>;
  arguments?: string[];
  requestCount?: number;
}

export interface Profile {
  id: string;
  name: string;
  endpointType: EndpointType;
  enabled: boolean;
  endpoint: string;
  instances: string[];
  description?: string;
}

export interface Host {
  id: string;
  name: string;
  profileId?: string;
  configStatus: 'configured' | 'misconfigured' | 'unknown';
  connectionStatus: ConnectionStatus;
  configPath?: string;
  icon?: string;
  needsUpdate?: boolean;
}

export const serverDefinitions: ServerDefinition[] = [
  {
    id: 'postgres-tool',
    name: 'PostgreSQL MCP Tool',
    type: 'STDIO',
    description: 'A tool for interacting with PostgreSQL databases via MCP',
    author: 'MCP Team',
    version: '1.0.0',
    icon: '🐘',
    isOfficial: true,
    categories: ['Database', 'SQL', 'Development'],
    features: [
      'Database connection management',
      'SQL query execution',
      'Schema visualization',
      'Query optimizations'
    ],
    repository: 'https://github.com/mcp/postgres-tool',
    downloads: 3500,
    commandArgs: '--postgres-mcp',
    environment: { 
      'PG_HOST': 'localhost',
      'PG_PORT': '5432'
    },
    tools: [
      {
        id: 'query_execute',
        name: 'execute_query',
        description: 'Execute a SQL query against a PostgreSQL database and return the results.',
        parameters: [
          {
            name: 'query',
            type: 'string',
            description: 'The SQL query to execute.',
            required: true
          },
          {
            name: 'params',
            type: 'array',
            description: 'Optional parameters for the query.',
            required: false
          }
        ]
      },
      {
        id: 'schema_info',
        name: 'get_schema_info',
        description: 'Get information about database schemas, tables, columns, and relationships.',
        parameters: [
          {
            name: 'schema_name',
            type: 'string',
            description: 'The schema name to inspect. If not provided, returns all schemas.',
            required: false
          },
          {
            name: 'table_name',
            type: 'string',
            description: 'Filter results to a specific table.',
            required: false
          }
        ]
      },
      {
        id: 'explain_analyze',
        name: 'explain_analyze',
        description: 'Generate and analyze an execution plan for a query.',
        parameters: [
          {
            name: 'query',
            type: 'string',
            description: 'The SQL query to analyze.',
            required: true
          }
        ]
      }
    ]
  },
  {
    id: 'github-copilot-proxy',
    name: 'GitHub Copilot Proxy',
    type: 'HTTP_SSE',
    description: 'Proxy for GitHub Copilot API',
    author: 'MCP Team',
    version: '1.2.0',
    icon: '🤖',
    isOfficial: true,
    categories: ['AI', 'Development', 'Productivity'],
    features: [
      'Code suggestions',
      'Auto-completion',
      'Comment-to-code generation',
      'API integration'
    ],
    repository: 'https://github.com/mcp/github-copilot-proxy',
    downloads: 4200,
    url: 'https://api.github.com/copilot/v1',
    headers: {
      'Authorization': 'Bearer ${GITHUB_TOKEN}',
      'Content-Type': 'application/json'
    },
    tools: [
      {
        id: 'code_completion',
        name: 'get_completions',
        description: 'Get code completion suggestions based on the current code context.',
        parameters: [
          {
            name: 'prefix',
            type: 'string',
            description: 'The code context to generate completions for.',
            required: true
          },
          {
            name: 'language',
            type: 'string',
            description: 'The programming language of the code.',
            required: false,
            default: 'javascript'
          },
          {
            name: 'max_tokens',
            type: 'number',
            description: 'Maximum number of tokens to generate.',
            required: false,
            default: 256
          }
        ]
      },
      {
        id: 'comment_to_code',
        name: 'comment_to_code',
        description: 'Generate code from a natural language comment or description.',
        parameters: [
          {
            name: 'comment',
            type: 'string',
            description: 'The natural language description of what code to generate.',
            required: true
          },
          {
            name: 'language',
            type: 'string',
            description: 'The programming language to generate code in.',
            required: false,
            default: 'javascript'
          }
        ]
      }
    ]
  },
  {
    id: 'local-file-assistant',
    name: 'Local File Assistant',
    type: 'STDIO',
    description: 'Assists with local file operations',
    author: 'MCP Team',
    version: '0.9.1',
    icon: '📁',
    isOfficial: false,
    categories: ['Files', 'System', 'Utility'],
    features: [
      'File search and indexing',
      'Content analysis',
      'File monitoring',
      'Batch operations'
    ],
    repository: 'https://github.com/mcp/local-file-assistant',
    downloads: 2800,
    tools: [
      {
        id: 'file_read',
        name: 'read_file',
        description: 'Read the contents of a file from the local filesystem.',
        parameters: [
          {
            name: 'path',
            type: 'string',
            description: 'Path to the file to read.',
            required: true
          },
          {
            name: 'encoding',
            type: 'string',
            description: 'File encoding to use when reading the file.',
            required: false,
            default: 'utf-8'
          }
        ]
      },
      {
        id: 'file_write',
        name: 'write_file',
        description: 'Write content to a file on the local filesystem.',
        parameters: [
          {
            name: 'path',
            type: 'string',
            description: 'Path to the file to write.',
            required: true
          },
          {
            name: 'content',
            type: 'string',
            description: 'Content to write to the file.',
            required: true
          },
          {
            name: 'encoding',
            type: 'string',
            description: 'File encoding to use when writing the file.',
            required: false,
            default: 'utf-8'
          }
        ]
      },
      {
        id: 'file_search',
        name: 'search_files',
        description: 'Search for files matching a pattern in a directory.',
        parameters: [
          {
            name: 'directory',
            type: 'string',
            description: 'Directory to search in.',
            required: true
          },
          {
            name: 'pattern',
            type: 'string',
            description: 'File pattern to match (glob format).',
            required: true
          },
          {
            name: 'recursive',
            type: 'boolean',
            description: 'Whether to search recursively in subdirectories.',
            required: false,
            default: true
          }
        ]
      },
      {
        id: 'file_delete',
        name: 'delete_file',
        description: 'Delete a file from the local filesystem.',
        parameters: [
          {
            name: 'path',
            type: 'string',
            description: 'Path to the file to delete.',
            required: true
          }
        ]
      }
    ]
  },
  {
    id: 'code-assistant',
    name: 'Code Assistant',
    type: 'HTTP_SSE',
    description: 'AI-powered code completion and suggestions',
    author: 'MCP Community',
    version: '2.1.0',
    icon: '💻',
    isOfficial: false,
    categories: ['Development', 'AI', 'Productivity'],
    features: [
      'Code completion',
      'Documentation generation',
      'Code refactoring',
      'Bug detection'
    ],
    repository: 'https://github.com/mcp-community/code-assistant',
    downloads: 3700,
    tools: [
      {
        id: 'complete_code',
        name: 'complete_code',
        description: 'Complete code based on the existing context.',
        parameters: [
          {
            name: 'code_context',
            type: 'string',
            description: 'Existing code context to complete from.',
            required: true
          },
          {
            name: 'language',
            type: 'string',
            description: 'Programming language of the code.',
            required: true
          },
          {
            name: 'max_length',
            type: 'number',
            description: 'Maximum length of completion.',
            required: false,
            default: 100
          }
        ]
      },
      {
        id: 'generate_docs',
        name: 'generate_documentation',
        description: 'Generate documentation for a given code snippet.',
        parameters: [
          {
            name: 'code',
            type: 'string',
            description: 'Code to document.',
            required: true
          },
          {
            name: 'language',
            type: 'string',
            description: 'Programming language of the code.',
            required: true
          },
          {
            name: 'doc_style',
            type: 'string',
            description: 'Documentation style (e.g., JSDoc, DocString).',
            required: false
          }
        ]
      }
    ]
  },
  {
    id: 'docker-compose-tools',
    name: 'Docker Compose Tools',
    type: 'STDIO',
    description: 'Tools for managing Docker Compose environments',
    author: 'MCP Community',
    version: '1.4.2',
    icon: '🐋',
    isOfficial: false,
    categories: ['DevOps', 'Containers'],
    features: [
      'Environment management',
      'Service scaling',
      'Config validation',
      'Performance monitoring'
    ],
    repository: 'https://github.com/mcp-community/docker-compose-tools',
    downloads: 2950,
    tools: [
      {
        id: 'docker_compose_up',
        name: 'compose_up',
        description: 'Start services defined in a docker-compose.yml file.',
        parameters: [
          {
            name: 'compose_file',
            type: 'string',
            description: 'Path to docker-compose.yml file.',
            required: false,
            default: './docker-compose.yml'
          },
          {
            name: 'services',
            type: 'array',
            description: 'List of services to start. If empty, starts all services.',
            required: false
          },
          {
            name: 'detach',
            type: 'boolean',
            description: 'Run in detached mode.',
            required: false,
            default: true
          }
        ]
      },
      {
        id: 'docker_compose_down',
        name: 'compose_down',
        description: 'Stop and remove services defined in a docker-compose.yml file.',
        parameters: [
          {
            name: 'compose_file',
            type: 'string',
            description: 'Path to docker-compose.yml file.',
            required: false,
            default: './docker-compose.yml'
          },
          {
            name: 'remove_volumes',
            type: 'boolean',
            description: 'Remove volumes as well.',
            required: false,
            default: false
          }
        ]
      }
    ]
  }
];

export const serverInstances: ServerInstance[] = [
  {
    id: 'postgres-dev',
    definitionId: 'postgres-tool',
    name: 'PostgresTool-DevDB',
    status: 'running',
    enabled: true,
    connectionDetails: '/usr/local/bin/postgres-mcp',
    environment: {
      'DB_URL': 'postgresql://dev:password@localhost:5432/dev'
    },
    requestCount: 124
  },
  {
    id: 'postgres-prod',
    definitionId: 'postgres-tool',
    name: 'PostgresTool-ProdDB',
    status: 'stopped',
    enabled: false,
    connectionDetails: '/usr/local/bin/postgres-mcp',
    environment: {
      'DB_URL': 'postgresql://prod:password@db.example.com:5432/prod'
    },
    requestCount: 37
  },
  {
    id: 'github-copilot',
    definitionId: 'github-copilot-proxy',
    name: 'GitHub Copilot',
    status: 'running',
    enabled: true,
    connectionDetails: 'https://api.github.com/copilot/v1',
    environment: {
      'GITHUB_TOKEN': 'github_pat_xxxxxxxxxxxx'
    },
    requestCount: 892
  },
  {
    id: 'local-files',
    definitionId: 'local-file-assistant',
    name: 'Local File Assistant',
    status: 'error',
    enabled: true,
    connectionDetails: '/usr/local/bin/file-assistant',
    arguments: ['--watch', '/home/user/projects'],
    requestCount: 56
  },
  {
    id: 'code-assist-team1',
    definitionId: 'code-assistant',
    name: 'Team1 Code Assistant',
    status: 'running',
    enabled: true,
    connectionDetails: 'http://localhost:8090/code-assist',
    requestCount: 245
  },
  {
    id: 'code-assist-team2',
    definitionId: 'code-assistant',
    name: 'Team2 Code Assistant',
    status: 'error',
    enabled: true,
    connectionDetails: 'http://localhost:8091/code-assist',
    requestCount: 178
  },
  {
    id: 'code-assist-personal',
    definitionId: 'code-assistant',
    name: 'Personal Code Assistant',
    status: 'stopped',
    enabled: false,
    connectionDetails: 'http://localhost:8092/code-assist',
    requestCount: 57
  },
  {
    id: 'docker-tools-dev',
    definitionId: 'docker-compose-tools',
    name: 'Development Docker Tools',
    status: 'running',
    enabled: true,
    connectionDetails: '/usr/local/bin/docker-tools',
    requestCount: 325
  },
  {
    id: 'docker-tools-prod',
    definitionId: 'docker-compose-tools',
    name: 'Production Docker Tools',
    status: 'stopped',
    enabled: false,
    connectionDetails: '/usr/local/bin/docker-tools',
    requestCount: 112
  },
  {
    id: 'docker-tools-test',
    definitionId: 'docker-compose-tools',
    name: 'Testing Docker Tools',
    status: 'running',
    enabled: true,
    connectionDetails: '/usr/local/bin/docker-tools',
    requestCount: 204
  },
];

export const profiles: Profile[] = [
  {
    id: 'general-dev',
    name: 'General Development',
    endpointType: 'HTTP_SSE',
    enabled: true,
    endpoint: 'http://localhost:8008/mcp',
    instances: ['github-copilot', 'local-files'],
    description: 'General development profile for everyday coding tasks'
  },
  {
    id: 'database-ops',
    name: 'Database Operations',
    endpointType: 'HTTP_SSE',
    enabled: true,
    endpoint: 'http://localhost:8009/mcp',
    instances: ['postgres-dev'],
    description: 'Profile for database operations and management'
  },
  {
    id: 'project-x',
    name: 'Project X',
    endpointType: 'STDIO',
    enabled: false,
    endpoint: '/usr/local/bin/mcp-stdio',
    instances: ['github-copilot', 'postgres-prod'],
    description: 'Specialized profile for Project X development'
  },
];

export const hosts: Host[] = [
  {
    id: 'cursor',
    name: 'Cursor',
    profileId: 'general-dev',
    configStatus: 'configured',
    connectionStatus: 'connected',
    configPath: '/Users/user/Library/Application Support/Cursor/settings.json',
    icon: '⌨️'
  },
  {
    id: 'claude-desktop',
    name: 'Claude Desktop',
    profileId: 'project-x',
    configStatus: 'misconfigured',
    connectionStatus: 'disconnected',
    configPath: '/Users/user/Library/Application Support/Claude/config.json',
    icon: '🧠',
    needsUpdate: true
  },
  {
    id: 'windsurf',
    name: 'Windsurf',
    profileId: 'database-ops',
    configStatus: 'unknown',
    connectionStatus: 'unknown',
    configPath: '/Users/user/.windsurf/config',
    icon: '🏄'
  },
];

export const discoveryItems: ServerDefinition[] = [
  {
    id: 'aws-toolkit',
    name: 'AWS Toolkit',
    type: 'STDIO',
    description: 'Tools for working with AWS services, including Lambda, EC2, S3, and more. Provides seamless integration with the AWS ecosystem.',
    author: 'AWS Community',
    version: '2.1.0',
    icon: '☁️',
    isOfficial: true,
    categories: ['Cloud', 'DevOps', 'Infrastructure'],
    features: [
      'Supports TypeScript development',
      'Auto-imports and code completion',
      'Real-time error checking',
      'Integrated debugging'
    ],
    repository: 'https://github.com/AWS Community/aws toolkit',
    downloads: 4500,
    tools: [
      {
        id: 'lambda_deploy',
        name: 'deploy_lambda',
        description: 'Deploy a Lambda function to AWS with specified configuration and permissions.',
        parameters: [
          {
            name: 'function_name',
            type: 'string',
            description: 'Name of the Lambda function to deploy.',
            required: true
          },
          {
            name: 'runtime',
            type: 'string',
            description: 'Runtime environment for the Lambda function (e.g., nodejs18.x, python3.9).',
            required: true
          },
          {
            name: 'source_path',
            type: 'string',
            description: 'Path to the function source code.',
            required: true
          },
          {
            name: 'memory_size',
            type: 'number',
            description: 'Memory allocation for the function in MB.',
            required: false,
            default: 128
          }
        ]
      },
      {
        id: 's3_operations',
        name: 'manage_s3',
        description: 'Perform operations on S3 buckets and objects.',
        parameters: [
          {
            name: 'bucket_name',
            type: 'string',
            description: 'Name of the S3 bucket.',
            required: true
          },
          {
            name: 'operation',
            type: 'string',
            description: 'Operation to perform (create, delete, list, upload, download).',
            required: true
          },
          {
            name: 'object_key',
            type: 'string',
            description: 'Object key for operations on specific objects.',
            required: false
          }
        ]
      },
      {
        id: 'ec2_control',
        name: 'manage_ec2',
        description: 'Control EC2 instances and manage their lifecycle.',
        parameters: [
          {
            name: 'instance_id',
            type: 'string',
            description: 'ID of the EC2 instance.',
            required: true
          },
          {
            name: 'action',
            type: 'string',
            description: 'Action to perform (start, stop, reboot, terminate).',
            required: true
          }
        ]
      }
    ]
  },
  {
    id: 'docker-assistant',
    name: 'Docker Assistant',
    type: 'HTTP_SSE',
    description: 'Helps manage Docker containers and images. Provides an intuitive interface for container management and monitoring.',
    author: 'Docker Community',
    version: '1.5.0',
    icon: '🐳',
    isOfficial: false,
    categories: ['DevOps', 'Containers', 'Infrastructure'],
    features: [
      'Container lifecycle management',
      'Image building and optimization',
      'Network configuration',
      'Volume management'
    ],
    repository: 'https://github.com/docker/assistant',
    downloads: 4000,
    tools: [
      {
        id: 'container_manage',
        name: 'manage_container',
        description: 'Start, stop, restart, or remove Docker containers.',
        parameters: [
          {
            name: 'container_id',
            type: 'string',
            description: 'ID or name of the container to manage.',
            required: true
          },
          {
            name: 'action',
            type: 'string',
            description: 'Action to perform (start, stop, restart, remove).',
            required: true
          },
          {
            name: 'force',
            type: 'boolean',
            description: 'Force the action if necessary.',
            required: false,
            default: false
          }
        ]
      },
      {
        id: 'image_build',
        name: 'build_image',
        description: 'Build a Docker image from a Dockerfile.',
        parameters: [
          {
            name: 'dockerfile_path',
            type: 'string',
            description: 'Path to the Dockerfile.',
            required: true
          },
          {
            name: 'tag',
            type: 'string',
            description: 'Tag for the built image.',
            required: true
          },
          {
            name: 'build_args',
            type: 'object',
            description: 'Build arguments to pass to the build process.',
            required: false
          }
        ]
      },
      {
        id: 'network_create',
        name: 'create_network',
        description: 'Create a Docker network with specified configuration.',
        parameters: [
          {
            name: 'network_name',
            type: 'string',
            description: 'Name for the network.',
            required: true
          },
          {
            name: 'driver',
            type: 'string',
            description: 'Network driver to use.',
            required: false,
            default: 'bridge'
          },
          {
            name: 'subnet',
            type: 'string',
            description: 'Subnet in CIDR format.',
            required: false
          }
        ]
      }
    ]
  },
  {
    id: 'kubernetes-helper',
    name: 'Kubernetes Helper',
    type: 'STDIO',
    description: 'Tools for working with Kubernetes clusters, including deployment, scaling, and monitoring solutions.',
    author: 'K8s Community',
    version: '0.9.5',
    icon: '⎈',
    isOfficial: false,
    categories: ['DevOps', 'Cloud', 'Infrastructure'],
    features: [
      'Cluster management',
      'Pod visualization',
      'Resource monitoring',
      'Deployment automation'
    ],
    repository: 'https://github.com/k8s/helper',
    downloads: 3800,
    tools: [
      {
        id: 'deploy_resource',
        name: 'apply_resource',
        description: 'Apply a Kubernetes resource definition to the cluster.',
        parameters: [
          {
            name: 'manifest_path',
            type: 'string',
            description: 'Path to the YAML or JSON manifest file.',
            required: true
          },
          {
            name: 'namespace',
            type: 'string',
            description: 'Kubernetes namespace to apply the resource to.',
            required: false,
            default: 'default'
          }
        ]
      },
      {
        id: 'pod_logs',
        name: 'get_pod_logs',
        description: 'Retrieve logs from a Kubernetes pod.',
        parameters: [
          {
            name: 'pod_name',
            type: 'string',
            description: 'Name of the pod.',
            required: true
          },
          {
            name: 'namespace',
            type: 'string',
            description: 'Kubernetes namespace where the pod is located.',
            required: false,
            default: 'default'
          },
          {
            name: 'container',
            type: 'string',
            description: 'Container name (if pod has multiple containers).',
            required: false
          },
          {
            name: 'tail_lines',
            type: 'number',
            description: 'Number of lines to show from the end of the logs.',
            required: false,
            default: 100
          }
        ]
      },
      {
        id: 'scale_deployment',
        name: 'scale_deployment',
        description: 'Scale a Kubernetes deployment to a specified number of replicas.',
        parameters: [
          {
            name: 'deployment_name',
            type: 'string',
            description: 'Name of the deployment to scale.',
            required: true
          },
          {
            name: 'replicas',
            type: 'number',
            description: 'Desired number of replicas.',
            required: true
          },
          {
            name: 'namespace',
            type: 'string',
            description: 'Kubernetes namespace where the deployment is located.',
            required: false,
            default: 'default'
          }
        ]
      }
    ]
  },
  {
    id: 'frontend-dev-tools',
    name: 'Frontend Dev Tools',
    type: 'HTTP_SSE',
    description: 'Utilities for frontend development, including code generators, component libraries, and testing tools.',
    author: 'Web Dev Team',
    version: '3.2.1',
    icon: '🖥️',
    isOfficial: true,
    categories: ['Web', 'UI/UX', 'Frontend'],
    features: [
      'Component scaffolding',
      'Style generation',
      'Accessibility testing',
      'Performance optimization'
    ],
    repository: 'https://github.com/webdev/frontend-tools',
    downloads: 3800
  },
];
