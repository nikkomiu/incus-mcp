import { logger } from "./logger.js";

export class IncusError extends Error {
  command: string[];
  exitCode: number;
  stderr: string;

  constructor(command: string[], exitCode: number, stderr: string) {
    super(`incus command failed (${exitCode}): ${command.join(" ")}`);
    this.command = command;
    this.exitCode = exitCode;
    this.stderr = stderr;
  }
}

export const DEFAULT_TIMEOUT_MS = 30_000;
export const EXEC_TIMEOUT_MS = 60_000;
export const LAUNCH_TIMEOUT_MS = 120_000;

type ExecOptions = {
  timeoutMs?: number;
  stdin?: string;
};

let incusCheckPromise: Promise<void> | null = null;

type SpawnStream = ReadableStream<Uint8Array> | number | null | undefined;

async function readStream(stream: SpawnStream): Promise<string> {
  if (!stream || typeof stream === "number") {
    return "";
  }
  return new Response(stream).text();
}

async function ensureIncusAvailable(): Promise<void> {
  if (!incusCheckPromise) {
    incusCheckPromise = (async () => {
      let proc: ReturnType<typeof Bun.spawn>;
      try {
        proc = Bun.spawn(["incus", "version"], {
          stdin: "ignore",
          stdout: "pipe",
          stderr: "pipe",
        });
      } catch (error) {
        throw new Error("incus CLI not available");
      }

      const timeoutId = setTimeout(() => {
        try {
          proc.kill();
        } catch {
          // ignore
        }
      }, 5_000);

      const [exitCode, stderr] = await Promise.all([
        proc.exited,
        readStream(proc.stderr),
      ]);
      await readStream(proc.stdout);

      clearTimeout(timeoutId);

      if (exitCode !== 0) {
        throw new Error(`incus CLI not available: ${stderr.trim()}`);
      }
    })();
  }

  return incusCheckPromise;
}

export async function exec(args: string[], options: ExecOptions = {}) {
  await ensureIncusAvailable();

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const command = ["incus", ...args];
  const proc = Bun.spawn(command, {
    stdin: options.stdin ? "pipe" : "ignore",
    stdout: "pipe",
    stderr: "pipe",
  });

  if (options.stdin && proc.stdin) {
    proc.stdin.write(options.stdin);
    proc.stdin.end();
  }

  const timeoutId = setTimeout(() => {
    try {
      proc.kill();
    } catch {
      // ignore
    }
  }, timeoutMs);

  const [stdout, stderr, exitCode] = await Promise.all([
    readStream(proc.stdout),
    readStream(proc.stderr),
    proc.exited,
  ]);

  clearTimeout(timeoutId);

  if (exitCode !== 0) {
    throw new IncusError(command, exitCode, stderr || stdout);
  }

  return { exitCode, stdout, stderr };
}

export async function execText(args: string[], options?: ExecOptions): Promise<string> {
  logger?.debug({ command: ["incus", ...args] }, "execText executing incus command");
  const { stdout, stderr } = await exec(args, options);
  const text = stdout.trim();
  if (text.length > 0) {
    return text;
  }
  return stderr.trim();
}

export async function execJSON<T>(args: string[], options?: ExecOptions): Promise<T> {
  const execArgs = [...args, "--format", "json"];
  logger?.debug({ command: ["incus", ...execArgs] }, "execJSON executing incus command");
  const { stdout } = await exec(execArgs, options);
  try {
    return JSON.parse(stdout) as T;
  } catch (error) {
    const preview = stdout.trim().slice(0, 1000);
    throw new Error(`Failed to parse JSON output: ${preview}`);
  }
}

export function remoteTarget(remote?: string, name?: string): string {
  if (remote && name) {
    return `${remote}:${name}`;
  }
  if (remote) {
    return `${remote}:`;
  }
  if (name) {
    return name;
  }
  return "";
}
