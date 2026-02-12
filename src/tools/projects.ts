import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { execJSON, execText, remoteTarget } from "../incus.js";
import { toolError, toolJson, toolText } from "./utils.js";

const remoteParam = z.string().min(1).optional();
const projectParam = z.string().min(1).optional();

export function registerProjectTools(server: McpServer) {
  server.registerTool(
    "project-list",
    {
      description: "List projects",
      inputSchema: z
        .object({
          remote: remoteParam,
        })
        .strict(),
    },
    async ({ remote }) => {
      try {
        const args = ["project", "list"];
        const target = remoteTarget(remote);
        if (target) {
          args.push(target);
        }
        const data = await execJSON<unknown[]>(args);
        return toolJson(data);
      } catch (error) {
        return toolError(error);
      }
    }
  );

  server.registerTool(
    "project-info",
    {
      description: "Show project details",
      inputSchema: z
        .object({
          name: z.string().min(1),
          remote: remoteParam,
        })
        .strict(),
    },
    async ({ name, remote }) => {
      try {
        const args = ["project", "show", remoteTarget(remote, name)];
        const text = await execText(args);
        return toolText(text);
      } catch (error) {
        return toolError(error);
      }
    }
  );

  server.registerTool(
    "project-create",
    {
      description: "Create a project",
      inputSchema: z
        .object({
          name: z.string().min(1),
          remote: remoteParam,
          description: z.string().min(1).optional(),
          config: z.record(z.string()).optional(),
        })
        .strict(),
    },
    async ({ name, remote, description, config }) => {
      try {
        const args = ["project", "create", remoteTarget(remote, name)];
        if (description) {
          args.push("--description", description);
        }
        if (config) {
          for (const [key, value] of Object.entries(config)) {
            args.push("-c", `${key}=${value}`);
          }
        }
        const text = await execText(args);
        return toolText(text);
      } catch (error) {
        return toolError(error);
      }
    }
  );

  server.registerTool(
    "project-delete",
    {
      description: "Delete a project",
      inputSchema: z
        .object({
          name: z.string().min(1),
          remote: remoteParam,
        })
        .strict(),
    },
    async ({ name, remote }) => {
      try {
        const args = ["project", "delete", remoteTarget(remote, name)];
        const text = await execText(args);
        return toolText(text);
      } catch (error) {
        return toolError(error);
      }
    }
  );
}
