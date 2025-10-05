import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
  type MCPClient,
  type MCPEndpointConfig,
  type MCPTool,
} from "@copilotkit/runtime";
import { LangGraphAgent } from "@ag-ui/langgraph";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { NextRequest } from "next/server";

const DEFAULT_GITHUB_MCP_ENDPOINT = "https://api.githubcopilot.com/mcp";

const githubMcpEndpoint = process.env.GITHUB_MCP_ENDPOINT || DEFAULT_GITHUB_MCP_ENDPOINT;
const githubMcpToken = process.env.GITHUB_TOKEN;

const mcpServerConfigs = githubMcpToken
  ? [{ endpoint: githubMcpEndpoint, apiKey: githubMcpToken }]
  : [];

async function createStreamableHttpClient(endpoint: string, apiKey?: string) {
  const transport = new StreamableHTTPClientTransport(new URL(endpoint), {
    requestInit: {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
    },
  });

  const client = new Client({
    name: "kaizen-copilot-runtime",
    version: "1.0.0",
  });

  await client.connect(transport);
  return client;
}

async function createMcpClient(config: MCPEndpointConfig): Promise<MCPClient> {
  const toToolMap = (tools: any[]): Record<string, MCPTool> => {
    const map: Record<string, MCPTool> = {};
    for (const tool of tools) {
      const toolName = tool.name;
      const toolDescription = tool.description || tool.title || `MCP tool: ${toolName}`;
      const inputSchema = tool.inputSchema || tool.input_schema || tool.schema || undefined;

      map[toolName] = {
        description: toolDescription,
        schema: inputSchema
          ? {
              parameters: {
                jsonSchema: inputSchema,
              },
            }
          : undefined,
        async execute(params: Record<string, unknown>) {
          const executionClient = await createStreamableHttpClient(config.endpoint, config.apiKey);
          try {
            const result = await executionClient.callTool({
              name: toolName,
              arguments: params ?? {},
            });

            if (result.structuredContent) {
              return result.structuredContent;
            }

            const textBlock = result.content?.find(
              (entry: any) => entry?.type === "text" && "text" in entry
            );

            if (textBlock && typeof textBlock.text === "string") {
              return textBlock.text;
            }

            return result;
          } finally {
            await executionClient.close();
          }
        },
      } satisfies MCPTool;
    }
    return map;
  };

  return {
    async tools() {
      const client = await createStreamableHttpClient(config.endpoint, config.apiKey);
      try {
        const listResult = await client.listTools();
        return toToolMap(listResult.tools ?? []);
      } finally {
        await client.close();
      }
    },
  } satisfies MCPClient;
}

// 1. You can use any service adapter here for multi-agent support. We use
//    the empty adapter since we're only using one agent.
const serviceAdapter = new ExperimentalEmptyAdapter();

// 2. Create the CopilotRuntime instance and utilize the LangGraph AG-UI
//    integration to setup the connection.
const runtime = new CopilotRuntime({
  agents: {
    sample_agent: new LangGraphAgent({
      deploymentUrl: process.env.LANGGRAPH_DEPLOYMENT_URL || "http://localhost:8123",
      graphId: "sample_agent",
      langsmithApiKey: process.env.LANGSMITH_API_KEY || "",
    }),
  },
  // mcpServers: mcpServerConfigs,
  // createMCPClient: mcpServerConfigs.length > 0 ? createMcpClient : undefined,
});

// 3. Build a Next.js API route that handles the CopilotKit runtime requests.
export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
