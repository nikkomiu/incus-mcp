# Logging — Pino + File Rotation Plan

## Context

Add structured logging to the MCP server using a popular, lightweight Node logger that is compatible with Bun. Logs should be written to a file located next to the compiled server binary when running a build, append on each run (no overwrite), and optionally truncate to keep only the last day of logs. All log behavior should be configurable via environment variables.

## Project Structure

```
incus-mcp/
├── package.json        (update — add logger dependency)
└── src/
    ├── index.ts        (update — initialize logger, replace console.error)
    └── logger.ts       (new — logger setup, file path, truncation)
```

## Design Decisions

- **Logger choice**: Use `pino` — fast, minimal, Bun-compatible, and supports file streams.
- **Stdout safety**: Continue to avoid stdout; log to file and optionally to `stderr`.
- **Append-only file**: Use `pino.destination` with default append behavior.
- **Binary-relative logs**: Default log file location next to the running binary; fall back to script directory when running with `bun run`.
- **Best-effort truncation**: On startup, optionally prune older log entries without risking data loss.
- **Env configuration**: All settings (path, level, truncation) are env-controlled with safe defaults.

## Implementation Steps

### 1. Add dependency

Install `pino` as a runtime dependency.

### 2. Add `src/logger.ts`

Create a logger module that:

- Resolves the log directory and file:
  - If running a compiled binary, use `dirname(process.execPath)`.
  - If running with Bun (`process.execPath` ends in `bun`), use `dirname(process.argv[1])` or `process.cwd()`.
  - Allow overrides via `LOG_FILE` and `LOG_DIR`.
- Builds a `pino` logger with:
  - `level` from `LOG_LEVEL` (default `info`)
  - `timestamp: pino.stdTimeFunctions.isoTime`
  - `pino.destination({ dest, sync: false })` for append-only file output
  - Optional `pino.multistream` to also write to `stderr` when `LOG_TO_STDERR=true`.

### 3. Add optional truncation

On startup, if `LOG_TRUNCATE=true`:

- Read the existing log file (if present)
- Keep only log lines within `LOG_MAX_AGE_HOURS` (default 24)
- Preserve unparseable lines to avoid accidental loss
- Rewrite using a temp file and replace the original

### 4. Wire logger in `src/index.ts`

- Initialize logger before server setup
- Replace `console.error` calls with `logger.error` / `logger.info`

## Environment Variables

- `LOG_LEVEL` (default `info`)
- `LOG_FILE` (default `<resolved_dir>/incus-mcp.log`)
- `LOG_DIR` (optional override for directory)
- `LOG_TO_STDERR` (default `true`)
- `LOG_TRUNCATE` (default `true`)
- `LOG_MAX_AGE_HOURS` (default `24`)

## Verification

1. Run locally with defaults: `bun run src/index.ts`
2. Confirm log file created next to script path and appends on restart
3. Set `LOG_TRUNCATE=true` and `LOG_MAX_AGE_HOURS=24` to verify pruning behavior
4. Build and run the compiled binary; confirm logs write next to the binary
