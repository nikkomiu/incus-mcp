import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  EXEC_TIMEOUT_MS,
  LAUNCH_TIMEOUT_MS,
  exec,
  execJSON,
  execText,
  remoteTarget,
} from "../incus.js";
import { addProjectFlag, toolError, toolJson, toolText } from "./utils.js";

const remoteParam = z.string().min(1).optional();
const projectParam = z.string().min(1).optional();

export function registerInstanceTools(server: McpServer) {
  server.registerTool(
    "instance-list",
    {
      description: "List instances",
      inputSchema: z
        .object({
          remote: remoteParam,
          project: projectParam,
        })
        .strict(),
    },
    async ({ remote, project }) => {
      try {
        const args = ["list"];
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
    "instance-info",
    {
      description: "Get instance info",
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
        const args = ["list", remoteTarget(remote, name)];
        addProjectFlag(args, project, { allowAllProjects: true });
        const data = await execJSON<unknown[]>(args);
        return toolJson(data[0] ?? null);
      } catch (error) {
        return toolError(error);
      }
    }
  );

  server.registerTool(
    "instance-launch",
    {
      description: "Launch a new instance",
      inputSchema: z
        .object({
          name: z.string().min(1),
          image: z.string().min(1),
          remote: remoteParam,
          project: projectParam,
          vm: z.boolean().optional(),
          profile: z.string().min(1).optional(),
          network: z.string().min(1).optional(),
          storage: z.string().min(1).optional(),
          config: z.record(z.string()).optional(),
        })
        .strict(),
    },
    async ({
      name,
      image,
      remote,
      project,
      vm,
      profile,
      network,
      storage,
      config,
    }) => {
      try {
        const args = ["launch", image, remoteTarget(remote, name)];
        if (vm) {
          args.push("--vm");
        }
        if (profile) {
          args.push("-p", profile);
        }
        if (network) {
          args.push("-n", network);
        }
        if (storage) {
          args.push("-s", storage);
        }
        if (config) {
          for (const [key, value] of Object.entries(config)) {
            args.push("-c", `${key}=${value}`);
          }
        }
        addProjectFlag(args, project);
        const text = await execText(args, { timeoutMs: LAUNCH_TIMEOUT_MS });
        return toolText(text);
      } catch (error) {
        return toolError(error);
      }
    }
  );

  server.registerTool(
    "instance-start",
    {
      description: "Start an instance",
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
        const args = ["start", remoteTarget(remote, name)];
        addProjectFlag(args, project);
        const text = await execText(args);
        return toolText(text);
      } catch (error) {
        return toolError(error);
      }
    }
  );

  server.registerTool(
    "instance-stop",
    {
      description: "Stop an instance",
      inputSchema: z
        .object({
          name: z.string().min(1),
          remote: remoteParam,
          project: projectParam,
          force: z.boolean().optional(),
        })
        .strict(),
    },
    async ({ name, remote, project, force }) => {
      try {
        const args = ["stop", remoteTarget(remote, name)];
        if (force) {
          args.push("--force");
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
    "instance-delete",
    {
      description: "Delete an instance",
      inputSchema: z
        .object({
          name: z.string().min(1),
          remote: remoteParam,
          project: projectParam,
          force: z.boolean().optional(),
        })
        .strict(),
    },
    async ({ name, remote, project, force }) => {
      try {
        const args = ["delete", remoteTarget(remote, name)];
        if (force) {
          args.push("--force");
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
    "instance-exec",
    {
      description: "Execute a command in an instance",
      inputSchema: z
        .object({
          name: z.string().min(1),
          command: z.array(z.string().min(1)).min(1),
          remote: remoteParam,
          project: projectParam,
          cwd: z.string().min(1).optional(),
          env: z.record(z.string()).optional(),
        })
        .strict(),
    },
    async ({ name, command, remote, project, cwd, env }) => {
      try {
        const args = ["exec", remoteTarget(remote, name), "-T"];
        if (cwd) {
          args.push("--cwd", cwd);
        }
        if (env) {
          for (const [key, value] of Object.entries(env)) {
            args.push("--env", `${key}=${value}`);
          }
        }
        addProjectFlag(args, project);
        args.push("--", ...command);
        const result = await exec(args, { timeoutMs: EXEC_TIMEOUT_MS });
        const combined = [result.stdout.trimEnd(), result.stderr.trimEnd()]
          .filter(Boolean)
          .join("\n");
        return toolText(combined);
      } catch (error) {
        return toolError(error);
      }
    }
  );

  server.registerTool(
    "instance-rebuild",
    {
      description: "Rebuild an instance from an image",
      inputSchema: z
        .object({
          name: z.string().min(1),
          image: z.string().min(1),
          remote: remoteParam,
          project: projectParam,
          force: z.boolean().optional(),
        })
        .strict(),
    },
    async ({ name, image, remote, project, force }) => {
      try {
        const args = ["rebuild", image, remoteTarget(remote, name)];
        if (force) {
          args.push("--force");
        }
        addProjectFlag(args, project);
        const text = await execText(args);
        return toolText(text);
      } catch (error) {
        return toolError(error);
      }
    }
  );
}
