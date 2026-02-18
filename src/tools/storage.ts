import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { execJSON, execText, remoteTarget } from "../incus.js";
import { addProjectFlag, toolError, toolJson, toolText } from "./utils.js";

const remoteParam = z.string().min(1).optional();
const projectParam = z.string().min(1).optional();

export function registerStorageTools(server: McpServer) {
  server.registerTool(
    "storage_pool_list",
    {
      description:
        "List storage pools on a remote. Use this to discover pool names and drivers (e.g., dir, zfs, btrfs, lvm) before creating volumes or launching instances.",
      inputSchema: z
        .object({
          remote: remoteParam,
          project: projectParam,
        })
        .strict(),
    },
    async ({ remote, project }) => {
      try {
        const args = ["storage", "list"];
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
    "storage_pool_info",
    {
      description:
        "Show full YAML for a storage pool (driver, config, and status). Helpful for troubleshooting capacity, backend settings, and pool features.",
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
        const args = ["storage", "show", remoteTarget(remote, name)];
        addProjectFlag(args, project, { allowAllProjects: true });
        const text = await execText(args);
        return toolText(text);
      } catch (error) {
        return toolError(error);
      }
    }
  );

  server.registerTool(
    "storage_volume_list",
    {
      description:
        "List storage volumes in a pool. Use to discover volume names and types before attaching, copying, or deleting volumes.",
      inputSchema: z
        .object({
          pool: z.string().min(1),
          remote: remoteParam,
          project: projectParam,
        })
        .strict(),
    },
    async ({ pool, remote, project }) => {
      try {
        const args = ["storage", "volume", "list", remoteTarget(remote, pool)];
        addProjectFlag(args, project);
        const data = await execJSON<unknown[]>(args);
        return toolJson(data);
      } catch (error) {
        return toolError(error);
      }
    }
  );

  server.registerTool(
    "storage_volume_info",
    {
      description:
        "Show full YAML for a storage volume (config, description, used-by). Useful when debugging mounts, quotas, and how a volume is referenced.",
      inputSchema: z
        .object({
          pool: z.string().min(1),
          volume: z.string().min(1),
          remote: remoteParam,
          project: projectParam,
        })
        .strict(),
    },
    async ({ pool, volume, remote, project }) => {
      try {
        const args = [
          "storage",
          "volume",
          "show",
          remoteTarget(remote, pool),
          volume,
        ];
        addProjectFlag(args, project);
        const text = await execText(args);
        return toolText(text);
      } catch (error) {
        return toolError(error);
      }
    }
  );

  server.registerTool(
    "storage_volume_create",
    {
      description:
        "Create a new custom storage volume in a pool, with optional `contentType` and config key/values (e.g., size/quota depending on driver).",
      inputSchema: z
        .object({
          pool: z.string().min(1),
          name: z.string().min(1),
          remote: remoteParam,
          project: projectParam,
          contentType: z.string().min(1).optional(),
          config: z.record(z.string()).optional(),
        })
        .strict(),
    },
    async ({ pool, name, remote, project, contentType, config }) => {
      try {
        const args = [
          "storage",
          "volume",
          "create",
          remoteTarget(remote, pool),
          name,
        ];
        if (contentType) {
          args.push("--content-type", contentType);
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
    "storage_volume_delete",
    {
      description:
        "Delete a storage volume from a pool. This fails if the volume is in use (e.g., attached to an instance or referenced by a profile).",
      inputSchema: z
        .object({
          pool: z.string().min(1),
          volume: z.string().min(1),
          remote: remoteParam,
          project: projectParam,
        })
        .strict(),
    },
    async ({ pool, volume, remote, project }) => {
      try {
        const args = [
          "storage",
          "volume",
          "delete",
          remoteTarget(remote, pool),
          volume,
        ];
        addProjectFlag(args, project);
        const text = await execText(args);
        return toolText(text);
      } catch (error) {
        return toolError(error);
      }
    }
  );
}
