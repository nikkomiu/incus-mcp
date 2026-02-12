import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerImageTools } from "./tools/images.js";
import { registerInstanceTools } from "./tools/instances.js";
import { registerNetworkTools } from "./tools/networks.js";
import { registerProfileTools } from "./tools/profiles.js";
import { registerProjectTools } from "./tools/projects.js";
import { registerRemoteTools } from "./tools/remotes.js";
import { registerSnapshotTools } from "./tools/snapshots.js";
import { registerStorageTools } from "./tools/storage.js";
import { initLogger } from "./logger.js";

const logger = await initLogger();

const server = new McpServer({
  name: "incus-mcp",
  version: "0.1.0",
});

registerRemoteTools(server);
registerInstanceTools(server);
registerImageTools(server);
registerNetworkTools(server);
registerStorageTools(server);
registerProfileTools(server);
registerProjectTools(server);
registerSnapshotTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
logger.info("incus-mcp server running");
