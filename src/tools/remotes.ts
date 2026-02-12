import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { execJSON, execText } from "../incus.js";
import { toolError, toolJson, toolText } from "./utils.js";

export function registerRemoteTools(server: McpServer) {
  server.registerTool(
    "remote-list",
    {
      description: "List configured Incus remotes",
      inputSchema: z.object({}).strict(),
    },
    async () => {
      try {
        const data = await execJSON<Record<string, unknown>>(["remote", "list"]);
        return toolJson(data);
      } catch (error) {
        return toolError(error);
      }
    }
  );

  server.registerTool(
    "remote-get-default",
    {
      description: "Get the default Incus remote",
      inputSchema: z.object({}).strict(),
    },
    async () => {
      try {
        const text = await execText(["remote", "get-default"]);
        return toolText(text);
      } catch (error) {
        return toolError(error);
      }
    }
  );
}
