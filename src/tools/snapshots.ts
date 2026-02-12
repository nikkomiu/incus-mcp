import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { execJSON, execText, remoteTarget } from "../incus.js";
import { addProjectFlag, toolError, toolJson, toolText } from "./utils.js";

const remoteParam = z.string().min(1).optional();
const projectParam = z.string().min(1).optional();

export function registerSnapshotTools(server: McpServer) {
  server.registerTool(
    "snapshot-list",
    {
      description: "List instance snapshots",
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
    "snapshot-create",
    {
      description: "Create an instance snapshot",
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
    "snapshot-restore",
    {
      description: "Restore an instance snapshot",
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
    "snapshot-delete",
    {
      description: "Delete an instance snapshot",
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
