import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { execJSON, execText, LAUNCH_TIMEOUT_MS } from "../incus.js";
import { toolError, toolJson, toolText } from "./utils.js";

export function registerRemoteTools(server: McpServer) {
  server.registerTool(
    "remote_list",
    {
      description:
        "List configured Incus remotes from your local `incus remote` config. Use this to discover remote names (e.g., `local`, `prod`) for other tools.",
      inputSchema: z.object({}).strict(),
    },
    async () => {
      try {
        const data = await execJSON<Record<string, unknown>>(["remote", "list"]);
        return toolJson(data);
      } catch (error) {
        return toolError(error);
      }
    }
  );

  server.registerTool(
    "remote_get_default",
    {
      description:
        "Get the default remote name used when a tool's `remote` parameter is omitted.",
      inputSchema: z.object({}).strict(),
    },
    async () => {
      try {
        const text = await execText(["remote", "get-default"]);
        return toolText(text);
      } catch (error) {
        return toolError(error);
      }
    }
  );

  server.registerTool(
    "remote_set_default",
    {
      description:
        "Set the default remote name. After this, tools without an explicit `remote` will target the new default.",
      inputSchema: z
        .object({
          name: z.string().min(1, "Remote name is required"),
        })
        .strict(),
    },
    async ({ name }) => {
      try {
        const text = await execText(["remote", "set-default", name]);
        const message = text.length > 0 ? text : `Default remote set to ${name}`;
        return toolText(message);
      } catch (error) {
        return toolError(error);
      }
    }
  );

  server.registerTool(
    "remote_add",
    {
      description:
        "Add a new Incus remote to your local configuration. Supports certificate acceptance and password/token authentication for connecting to a remote Incus server.",
      inputSchema: z
        .object({
          name: z.string().min(1, "Remote name is required"),
          url: z.string().min(1, "Remote URL is required"),
          acceptCertificate: z.boolean().optional(),
          password: z.string().optional(),
          token: z.string().optional(),
          project: z.string().optional(),
          protocol: z.string().optional(),
          type: z.string().optional(),
          authType: z.string().optional(),
          public: z.boolean().optional(),
          global: z.boolean().optional(),
        })
        .strict(),
    },
    async (input) => {
      try {
        const args = ["remote", "add", input.name, input.url];

        if (input.acceptCertificate ?? true) {
          args.push("--accept-certificate");
        }
        if (input.password) {
          args.push("--password", input.password);
        }
        if (input.token) {
          args.push("--token", input.token);
        }
        if (input.project) {
          args.push("--project", input.project);
        }
        if (input.protocol) {
          args.push("--protocol", input.protocol);
        }
        if (input.type) {
          args.push("--type", input.type);
        }
        if (input.authType) {
          args.push("--auth-type", input.authType);
        }
        if (input.public) {
          args.push("--public");
        }
        if (input.global) {
          args.push("--global");
        }

        const text = await execText(args, {
          timeoutMs: LAUNCH_TIMEOUT_MS,
        });
        const message = text.length > 0 ? text : `Remote ${input.name} added`;
        return toolText(message);
      } catch (error) {
        return toolError(error);
      }
    }
  );
}
