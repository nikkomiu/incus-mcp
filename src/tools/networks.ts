import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { execJSON, execText, remoteTarget } from "../incus.js";
import { addProjectFlag, toolError, toolJson, toolText } from "./utils.js";

const remoteParam = z.string().min(1).optional();
const projectParam = z.string().min(1).optional();

export function registerNetworkTools(server: McpServer) {
  server.registerTool(
    "network_list",
    {
      description:
        "List networks on a remote (e.g., managed bridges, OVN networks). Use this to discover network names before attaching them to instances or editing configuration.",
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
    "network_info",
    {
      description:
        "Show full YAML for a network (config, description, status). Use when inspecting DHCP/NAT settings, subnets, or troubleshooting connectivity.",
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
    "network_create",
    {
      description:
        "Create a managed network. Optionally set a network `type` and config key/values (e.g., `ipv4.address`, `ipv4.nat`).",
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
    "network_delete",
    {
      description:
        "Delete a managed network by name. This fails if the network is in use by instances or profiles.",
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
