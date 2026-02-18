import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { execJSON, execText, remoteTarget } from "../incus.js";
import { addProjectFlag, toolError, toolJson, toolText } from "./utils.js";

const remoteParam = z.string().min(1).optional();
const projectParam = z.string().min(1).optional();

export function registerSnapshotTools(server: McpServer) {
  server.registerTool(
    "snapshot_list",
    {
      description:
        "List snapshots for an instance. Use this to discover snapshot names before restoring or deleting.",
      inputSchema: z
        .object({
          instance: z.string().min(1),
          remote: remoteParam,
          project: projectParam,
        })
        .strict(),
    },
    async ({ instance, remote, project }) => {
      try {
        const args = ["snapshot", "list", remoteTarget(remote, instance)];
        addProjectFlag(args, project);
        const data = await execJSON<unknown[]>(args);
        return toolJson(data);
      } catch (error) {
        return toolError(error);
      }
    }
  );

  server.registerTool(
    "snapshot_create",
    {
      description:
        "Create a snapshot of an instance. Set `stateful=true` to capture runtime state (when supported), useful for quick rollback points.",
      inputSchema: z
        .object({
          instance: z.string().min(1),
          name: z.string().min(1).optional(),
          remote: remoteParam,
          project: projectParam,
          stateful: z.boolean().optional(),
        })
        .strict(),
    },
    async ({ instance, name, remote, project, stateful }) => {
      try {
        const args = ["snapshot", "create", remoteTarget(remote, instance)];
        if (name) {
          args.push(name);
        }
        if (stateful) {
          args.push("--stateful");
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
    "snapshot_restore",
    {
      description:
        "Restore an instance to a snapshot. This rewinds the instance filesystem; use `stateful=true` when restoring stateful snapshots.",
      inputSchema: z
        .object({
          instance: z.string().min(1),
          name: z.string().min(1),
          remote: remoteParam,
          project: projectParam,
          stateful: z.boolean().optional(),
        })
        .strict(),
    },
    async ({ instance, name, remote, project, stateful }) => {
      try {
        const args = [
          "snapshot",
          "restore",
          remoteTarget(remote, instance),
          name,
        ];
        if (stateful) {
          args.push("--stateful");
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
    "snapshot_delete",
    {
      description:
        "Delete a snapshot from an instance. Use to clean up old rollback points and reclaim storage.",
      inputSchema: z
        .object({
          instance: z.string().min(1),
          name: z.string().min(1),
          remote: remoteParam,
          project: projectParam,
        })
        .strict(),
    },
    async ({ instance, name, remote, project }) => {
      try {
        const args = [
          "snapshot",
          "delete",
          remoteTarget(remote, instance),
          name,
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
