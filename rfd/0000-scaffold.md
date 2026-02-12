# RFD 0000: Incus MCP Server Scaffold

## Context

Scaffold a Bun + TypeScript MCP server that wraps the `incus` CLI to manage Incus containers/VMs across multiple remotes. The server uses existing `incus remote` configuration (no duplicate config), supports per-tool remote targeting via an optional `remote` parameter, and exposes broad coverage of Incus operations (36 tools across 8 resource categories).

## Project Structure

```
incus-mcp/
├── package.json
├── tsconfig.json
├── README.md
├── src/
│   ├── index.ts              # Entry point: McpServer + StdioServerTransport
│   ├── incus.ts              # CLI wrapper: exec(), execJSON(), execText(), IncusError
│   └── tools/
│       ├── remotes.ts        # remote-list, remote-get-default
│       ├── instances.ts      # instance-list, instance-info, instance-launch, instance-start, instance-stop, instance-delete, instance-exec, instance-rebuild
│       ├── images.ts         # image-list, image-info, image-delete
│       ├── networks.ts       # network-list, network-info, network-create, network-delete
│       ├── storage.ts        # storage-pool-list, storage-pool-info, storage-volume-list, storage-volume-info, storage-volume-create, storage-volume-delete
│       ├── profiles.ts       # profile-list, profile-info, profile-create, profile-edit, profile-delete
│       ├── projects.ts       # project-list, project-info, project-create, project-delete
│       └── snapshots.ts      # snapshot-list, snapshot-create, snapshot-restore, snapshot-delete
```

## Implementation Steps

### Step 1: Project Foundation

**`package.json`** - `"type": "module"`, dependencies: `@modelcontextprotocol/sdk` (^1.26.0), `zod` (^3.25.0). Dev deps: `@types/bun`, `typescript`. Scripts: `start` (bun run src/index.ts), `dev` (bun --watch), `build`, `typecheck`.

**`tsconfig.json`** - target ESNext, module ESNext, moduleResolution bundler, types ["bun-types"], strict mode.

Run `bun install`.

### Step 2: CLI Wrapper (`src/incus.ts`)

Core module every tool depends on:

- **`exec(args, options?)`** - Spawns `incus` with `Bun.spawn()`. Uses `stdin: "ignore"` (critical: MCP owns stdin). Returns `{ exitCode, stdout, stderr }`. Throws `IncusError` on non-zero exit. Supports timeout (kill process after N ms) and optional `stdin` data (for `profile edit` piping).
- **`execJSON<T>(args, options?)`** - Appends `--format json`, parses stdout as JSON.
- **`execText(args, options?)`** - Returns trimmed stdout string.
- **`remoteTarget(remote?, name?)`** - Builds `"remote:name"` notation. Examples: `("inc0", "myvm")` -> `"inc0:myvm"`, `("inc0")` -> `"inc0:"`, `(undefined, "myvm")` -> `"myvm"`.
- **`IncusError`** - Custom error with command, exitCode, stderr.
- **Binary check** - On first call, verify `incus version` works. Cache result.
- **Timeouts** - 30s default, 60s for exec, 120s for launch.

### Step 3: Entry Point (`src/index.ts`)

Create `McpServer({ name: "incus-mcp", version: "0.1.0" })`. Import and call each `registerXTools(server)`. Connect `StdioServerTransport`. Log to stderr only.

### Step 4: Remote Tools (`src/tools/remotes.ts`)

| Tool | CLI Command | Output |
|------|------------|--------|
| `remote-list` | `incus remote list --format json` | JSON object keyed by remote name |
| `remote-get-default` | `incus remote get-default` | Text (remote name) |

### Step 5: Instance Tools (`src/tools/instances.ts`)

All accept optional `remote` and `project` params.

| Tool | CLI Command | Output |
|------|------------|--------|
| `instance-list` | `incus list [remote:] --format json` | JSON array |
| `instance-info` | `incus list [remote:]<name> --format json` | JSON (first element) |
| `instance-launch` | `incus launch <image> [remote:]<name> [--vm] [-p profile] [-n net] [-s storage] [-c k=v]` | Text |
| `instance-start` | `incus start [remote:]<name>` | Text |
| `instance-stop` | `incus stop [remote:]<name> [--force]` | Text |
| `instance-delete` | `incus delete [remote:]<name> [--force]` | Text |
| `instance-exec` | `incus exec [remote:]<name> -T [--cwd] [--env K=V] -- <cmd...>` | Text (stdout/stderr) |
| `instance-rebuild` | `incus rebuild <image> [remote:]<name> [--force]` | Text |

Note: `-T` forces non-interactive mode for exec (no TTY).

### Step 6: Image Tools (`src/tools/images.ts`)

| Tool | CLI Command | Output |
|------|------------|--------|
| `image-list` | `incus image list [remote:] --format json` | JSON array |
| `image-info` | `incus image list [remote:]<fingerprint> --format json` | JSON (first element) |
| `image-delete` | `incus image delete [remote:]<fingerprint>` | Text |

### Step 7: Network Tools (`src/tools/networks.ts`)

| Tool | CLI Command | Output |
|------|------------|--------|
| `network-list` | `incus network list [remote:] --format json` | JSON array |
| `network-info` | `incus network show [remote:]<name>` | YAML text |
| `network-create` | `incus network create [remote:]<name> [--type] [key=val...]` | Text |
| `network-delete` | `incus network delete [remote:]<name>` | Text |

### Step 8: Storage Tools (`src/tools/storage.ts`)

| Tool | CLI Command | Output |
|------|------------|--------|
| `storage-pool-list` | `incus storage list [remote:] --format json` | JSON array |
| `storage-pool-info` | `incus storage show [remote:]<name>` | YAML text |
| `storage-volume-list` | `incus storage volume list [remote:]<pool> --format json` | JSON array |
| `storage-volume-info` | `incus storage volume show [remote:]<pool> <vol>` | YAML text |
| `storage-volume-create` | `incus storage volume create [remote:]<pool> <name> [--content-type] [key=val...]` | Text |
| `storage-volume-delete` | `incus storage volume delete [remote:]<pool> <vol>` | Text |

### Step 9: Snapshot Tools (`src/tools/snapshots.ts`)

| Tool | CLI Command | Output |
|------|------------|--------|
| `snapshot-list` | `incus snapshot list [remote:]<instance> --format json` | JSON array |
| `snapshot-create` | `incus snapshot create [remote:]<instance> [name] [--stateful]` | Text |
| `snapshot-restore` | `incus snapshot restore [remote:]<instance> <name> [--stateful]` | Text |
| `snapshot-delete` | `incus snapshot delete [remote:]<instance> <name>` | Text |

### Step 10: Profile Tools (`src/tools/profiles.ts`)

| Tool | CLI Command | Output |
|------|------------|--------|
| `profile-list` | `incus profile list [remote:] --format json` | JSON array |
| `profile-info` | `incus profile show [remote:]<name>` | YAML text |
| `profile-create` | `incus profile create [remote:]<name> [--description]` | Text |
| `profile-edit` | `echo "<yaml>" \| incus profile edit [remote:]<name>` | Text |
| `profile-delete` | `incus profile delete [remote:]<name>` | Text |

Note: `profile-edit` pipes YAML via stdin to `Bun.spawn()`.

### Step 11: Project Tools (`src/tools/projects.ts`)

| Tool | CLI Command | Output |
|------|------------|--------|
| `project-list` | `incus project list [remote:] --format json` | JSON array |
| `project-info` | `incus project show [remote:]<name>` | YAML text |
| `project-create` | `incus project create [remote:]<name> [--description] [-c k=v]` | Text |
| `project-delete` | `incus project delete [remote:]<name>` | Text |

### Step 12: Git Init + README

Initialize git repo. Update README.md with project description, setup instructions, tool inventory, and Claude Desktop/Code configuration examples.

## Key Design Decisions

- **`stdin: "ignore"` on all spawned processes** - MCP owns stdin for JSON-RPC; child processes must not consume it
- **Never use `console.log()`** - Corrupts stdio transport; use `console.error()` for all logging
- **Per-tool `remote` param** (optional) - More flexible than a global setting; omitting uses the CLI default remote
- **Per-tool `project` param** (optional) - Supports Incus project scoping
- **JSON where possible, YAML as fallback** - `list` commands support `--format json`; `show` commands return YAML which is passed through as-is (no YAML parser dependency)
- **`incus list <name> --format json`** for instance-info instead of `incus info` (which lacks JSON output)
- **Tool naming**: `<resource>-<action>` in kebab-case for natural grouping

## Error Handling

- `IncusError` thrown on non-zero exit codes (command, exitCode, stderr)
- Binary availability check on first call (cached)
- Tool handlers catch errors and return `{ content: [...], isError: true }`
- Configurable timeouts per command type (30s/60s/120s)
- JSON parse failures wrapped with raw output context

## Verification

1. `bun run typecheck` - Ensure no type errors
2. `bun run start` - Verify server starts without errors on stderr
3. Configure in Claude Code settings and test tools:
   - `remote-list` - Should return configured remotes
   - `instance-list` - Should list instances on default remote
   - `instance-list` with `remote` param - Should target specific remote
   - `instance-exec` - Should run a command in an instance
4. Test error cases: invalid remote name, non-existent instance, missing `incus` binary
