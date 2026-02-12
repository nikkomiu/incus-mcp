import pino, { multistream, type DestinationStream } from "pino";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { config } from "./config";

async function truncateLogFile(filePath: string, maxAgeMs: number): Promise<void> {
  try {
    const raw = await readFile(filePath, "utf8");
    const cutoff = Date.now() - maxAgeMs;
    const kept: string[] = [];

    for (const line of raw.split(/\r?\n/)) {
      if (!line) {
        continue;
      }

      let keep = true;
      try {
        const parsed = JSON.parse(line) as { time?: string | number };
        const timeValue = parsed.time;
        if (timeValue !== undefined) {
          let timestamp: number | null = null;
          if (typeof timeValue === "number") {
            timestamp = timeValue;
          } else if (typeof timeValue === "string") {
            const parsedDate = Date.parse(timeValue);
            if (!Number.isNaN(parsedDate)) {
              timestamp = parsedDate;
            }
          }
          if (timestamp !== null) {
            keep = timestamp >= cutoff;
          }
        }
      } catch {
        keep = true;
      }

      if (keep) {
        kept.push(line);
      }
    }

    const tempPath = `${filePath}.${Date.now()}.tmp`;
    const payload = kept.length ? `${kept.join("\n")}\n` : "";
    await writeFile(tempPath, payload, "utf8");
    await rename(tempPath, filePath);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== "ENOENT") {
      console.error("Failed to truncate log file", error);
    }
  }
}

export let logger: pino.Logger | null = null;
let initPromise: Promise<pino.Logger> | null = null;

export async function initLogger(): Promise<pino.Logger> {
  if (logger) {
    return logger;
  }

  if (!initPromise) {
    initPromise = (async () => {
      const logConfig = config.log;
      const logFilePath = logConfig.filePath;
      await mkdir(dirname(logFilePath), { recursive: true });

      if (logConfig.truncate && logConfig.maxAgeHours > 0) {
        await truncateLogFile(logFilePath, logConfig.maxAgeHours * 60 * 60 * 1000);
      }

      const fileStream = pino.destination({ dest: logFilePath, sync: false });
      const streams: Array<{ stream: DestinationStream }> = [{ stream: fileStream }];

      if (logConfig.logToStderr) {
        streams.push({ stream: pino.destination({ dest: 2, sync: false }) });
      }

      const createdLogger =
        streams.length > 1
          ? pino({ level: logConfig.level, timestamp: pino.stdTimeFunctions.isoTime }, multistream(streams))
          : pino({ level: logConfig.level, timestamp: pino.stdTimeFunctions.isoTime }, fileStream);

      logger = createdLogger;
      return createdLogger;
    })().catch((error) => {
      initPromise = null;
      throw error;
    });
  }

  return initPromise;
}
