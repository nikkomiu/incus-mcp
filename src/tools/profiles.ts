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
      description:
        "List profiles on a remote/project. Use this to discover profile names before launching instances or applying configuration changes.",
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
      description:
        "Show full YAML for a profile (config and devices). Helpful for auditing shared defaults applied to instances.",
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
      description:
        "Create a new profile, optionally with a description. Use profiles to share common config/devices across many instances.",
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
      description:
        "Replace a profile's configuration using YAML (equivalent to `incus profile edit`). Use when making multiple config/device changes at once.",
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
      description:
        "Delete a profile by name. This fails if the profile is in use by instances.",
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
