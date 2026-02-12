import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { execJSON, execText, remoteTarget } from "../incus.js";
import { addProjectFlag, toolError, toolJson, toolText } from "./utils.js";

const remoteParam = z.string().min(1).optional();
const projectParam = z.string().min(1).optional();

export function registerImageTools(server: McpServer) {
  server.registerTool(
    "image_list",
    {
      description: "List images",
      inputSchema: z
        .object({
          remote: remoteParam,
          project: projectParam,
        })
        .strict(),
    },
    async ({ remote, project }) => {
      try {
        const args = ["image", "list"];
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
    "image_info",
    {
      description: "Get image info",
      inputSchema: z
        .object({
          fingerprint: z.string().min(1),
          remote: remoteParam,
          project: projectParam,
        })
        .strict(),
    },
    async ({ fingerprint, remote, project }) => {
      try {
        const args = ["image", "list", remoteTarget(remote, fingerprint)];
        addProjectFlag(args, project, { allowAllProjects: true });
        const data = await execJSON<unknown[]>(args);
        return toolJson(data[0] ?? null);
      } catch (error) {
        return toolError(error);
      }
    }
  );

  server.registerTool(
    "image_delete",
    {
      description: "Delete an image",
      inputSchema: z
        .object({
          fingerprint: z.string().min(1),
          remote: remoteParam,
          project: projectParam,
        })
        .strict(),
    },
    async ({ fingerprint, remote, project }) => {
      try {
        const args = ["image", "delete", remoteTarget(remote, fingerprint)];
        addProjectFlag(args, project);
        const text = await execText(args);
        return toolText(text);
      } catch (error) {
        return toolError(error);
      }
    }
  );
}
