import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { execJSON, execText, remoteTarget } from "../incus.js";
import { toolError, toolJson, toolText } from "./utils.js";

const remoteParam = z.string().min(1).optional();
const projectParam = z.string().min(1).optional();

export function registerProjectTools(server: McpServer) {
  server.registerTool(
    "project_list",
    {
      description:
        "List projects on a remote. Use this to discover project names and confirm isolation boundaries for instances, networks, and storage.",
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
    "project_info",
    {
      description:
        "Show full YAML for a project (config and limits). Useful for checking per-project restrictions and feature flags.",
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
    "project_create",
    {
      description:
        "Create a new project, optionally with a description and config key/values. Use projects to separate environments (dev/stage/prod) on the same Incus server.",
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
    "project_delete",
    {
      description:
        "Delete a project by name. This fails if the project still has resources (instances, networks, volumes, etc.).",
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
