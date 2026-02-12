import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { exec, execJSON, execText, remoteTarget } from "../incus.js";
import { addProjectFlag, toolError, toolJson, toolText } from "./utils.js";

const remoteParam = z.string().min(1).optional();
const projectParam = z.string().min(1).optional();

export function registerProfileTools(server: McpServer) {
  server.registerTool(
    "profile_list",
    {
      description: "List profiles",
      inputSchema: z
        .object({
          remote: remoteParam,
          project: projectParam,
        })
        .strict(),
    },
    async ({ remote, project }) => {
      try {
        const args = ["profile", "list"];
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
    "profile_info",
    {
      description: "Show profile details",
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
        const args = ["profile", "show", remoteTarget(remote, name)];
        addProjectFlag(args, project);
        const text = await execText(args);
        return toolText(text);
      } catch (error) {
        return toolError(error);
      }
    }
  );

  server.registerTool(
    "profile_create",
    {
      description: "Create a profile",
      inputSchema: z
        .object({
          name: z.string().min(1),
          remote: remoteParam,
          project: projectParam,
          description: z.string().min(1).optional(),
        })
        .strict(),
    },
    async ({ name, remote, project, description }) => {
      try {
        const args = ["profile", "create", remoteTarget(remote, name)];
        if (description) {
          args.push("--description", description);
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
    "profile_edit",
    {
      description: "Edit a profile using YAML",
      inputSchema: z
        .object({
          name: z.string().min(1),
          yaml: z.string().min(1),
          remote: remoteParam,
          project: projectParam,
        })
        .strict(),
    },
    async ({ name, yaml, remote, project }) => {
      try {
        const args = ["profile", "edit", remoteTarget(remote, name)];
        addProjectFlag(args, project);
        await exec(args, { stdin: yaml });
        return toolText("Profile updated.");
      } catch (error) {
        return toolError(error);
      }
    }
  );

  server.registerTool(
    "profile_delete",
    {
      description: "Delete a profile",
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
        const args = ["profile", "delete", remoteTarget(remote, name)];
        addProjectFlag(args, project);
        const text = await execText(args);
        return toolText(text);
      } catch (error) {
        return toolError(error);
      }
    }
  );
}
