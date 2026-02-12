import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { execJSON, execText, remoteTarget } from "../incus.js";
import { addProjectFlag, toolError, toolJson, toolText } from "./utils.js";

const remoteParam = z.string().min(1).optional();
const projectParam = z.string().min(1).optional();

export function registerNetworkTools(server: McpServer) {
  server.registerTool(
    "network-list",
    {
      description: "List networks",
      inputSchema: z
        .object({
          remote: remoteParam,
          project: projectParam,
        })
        .strict(),
    },
    async ({ remote, project }) => {
      try {
        const args = ["network", "list"];
        const target = remoteTarget(remote);
        if (target) {
          args.push(target);
        }
        addProjectFlag(args, project, { allowAllProjects: true });
        const data = await execJSON<unknown[]>(args);
        return toolJson(data);
      } catch (error) {
        return toolError(error);
      }
    }
  );

  server.registerTool(
    "network-info",
    {
      description: "Show network details",
      inputSchema: z
        .object({
          name: z.string().min(1),
          remote: remoteParam,
          project: projectParam,
        })
        .strict(),
    },
    async ({ name, remote, project }) => {
      try {
        const args = ["network", "show", remoteTarget(remote, name)];
        addProjectFlag(args, project);
        const text = await execText(args);
        return toolText(text);
      } catch (error) {
        return toolError(error);
      }
    }
  );

  server.registerTool(
    "network-create",
    {
      description: "Create a network",
      inputSchema: z
        .object({
          name: z.string().min(1),
          remote: remoteParam,
          project: projectParam,
          type: z.string().min(1).optional(),
          config: z.record(z.string()).optional(),
        })
        .strict(),
    },
    async ({ name, remote, project, type, config }) => {
      try {
        const args = ["network", "create", remoteTarget(remote, name)];
        if (type) {
          args.push("--type", type);
        }
        if (config) {
          for (const [key, value] of Object.entries(config)) {
            args.push(`${key}=${value}`);
          }
        }
        addProjectFlag(args, project);
        const text = await execText(args);
        return toolText(text);
      } catch (error) {
        return toolError(error);
      }
    }
  );

  server.registerTool(
    "network-delete",
    {
      description: "Delete a network",
      inputSchema: z
        .object({
          name: z.string().min(1),
          remote: remoteParam,
          project: projectParam,
        })
        .strict(),
    },
    async ({ name, remote, project }) => {
      try {
        const args = ["network", "delete", remoteTarget(remote, name)];
        addProjectFlag(args, project);
        const text = await execText(args);
        return toolText(text);
      } catch (error) {
        return toolError(error);
      }
    }
  );
}
