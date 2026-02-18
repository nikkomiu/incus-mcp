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
const consoleTypeParam = z.enum(["console", "vga"]).optional();

export function registerInstanceTools(server: McpServer) {
  server.registerTool(
    "instance_list",
    {
      description:
        "List instances (containers/VMs) on a remote. Use this to discover instance names, state, and basic details before calling other instance tools.",
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
    "instance_info",
    {
      description:
        "Get detailed info for a single instance by name (including config, devices, status, and other metadata).",
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
    "instance_logs",
    {
      description:
        "Fetch recent instance log entries (from `incus info --show-log`). Useful when an instance failed to start, crashed, or is behaving unexpectedly.",
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
        const args = ["info", remoteTarget(remote, name), "--show-log"];
        addProjectFlag(args, project);
        const text = await execText(args);
        return toolText(text);
      } catch (error) {
        return toolError(error);
      }
    }
  );

  server.registerTool(
    "instance_console_log",
    {
      description:
        "Retrieve the instance's console log buffer (from `incus console --show-log`). Helpful for early boot issues, cloud-init failures, or kernel/serial output.",
      inputSchema: z
        .object({
          name: z.string().min(1),
          remote: remoteParam,
          project: projectParam,
          type: consoleTypeParam,
        })
        .strict(),
    },
    async ({ name, remote, project, type }) => {
      try {
        const args = ["console", remoteTarget(remote, name), "--show-log"];
        if (type) {
          args.push("--type", type);
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
    "instance_launch",
    {
      description:
        "Launch a new instance from an image. Supports containers by default or VMs via `vm=true`, with optional profile/network/storage overrides and config key/values.",
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
    "instance_start",
    {
      description:
        "Start an existing instance (container/VM). Use after `instance_launch`, after a stop, or when recovering from a reboot.",
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
    "instance_stop",
    {
      description:
        "Stop a running instance. Set `force=true` to force-stop when a clean shutdown hangs or the guest is unresponsive.",
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
    "instance_delete",
    {
      description:
        "Delete an instance. This removes the instance and its root disk; use `force=true` to stop and delete in one step if needed.",
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
    "instance_exec",
    {
      description:
        "Execute a command inside an instance and return combined stdout/stderr. Use `cwd` and `env` to control the execution context.",
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
    "instance_rebuild",
    {
      description:
        "Rebuild an instance from an image (destructive). This replaces the instance root disk; use `force=true` to proceed without confirmation.",
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
