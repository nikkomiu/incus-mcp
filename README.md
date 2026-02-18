# Incus MCP Server

MCP server for managing Incus containers and VMs via the `incus` CLI. The server reads your existing `incus remote` configuration and exposes tools for remotes, instances, images, networks, storage, profiles, projects, and snapshots.

## Setup

1. Install dependencies:

```bash
bun install
```

2. Start the server:

```bash
bun run src/index.ts
```

## Scripts

- `bun run start` - start the MCP server
- `bun run build` - create a standalone binary in `dist/`
- `bun run type-check` - run TypeScript type checking
- `bun run lint` - lint the codebase with Biome
- `bun run format` - format source files with Biome

## Tools

Tool names are registered with underscores (some MCP clients may display them with hyphens).

- Remotes: `remote_list`, `remote_get_default`, `remote_set_default`, `remote_add`
- Instances: `instance_list`, `instance_info`, `instance_logs`, `instance_console_log`, `instance_launch`, `instance_start`, `instance_stop`, `instance_delete`, `instance_exec`, `instance_rebuild`
- Images: `image_list`, `image_info`, `image_delete`
- Networks: `network_list`, `network_info`, `network_create`, `network_delete`
- Storage: `storage_pool_list`, `storage_pool_info`, `storage_volume_list`, `storage_volume_info`, `storage_volume_create`, `storage_volume_delete`
- Profiles: `profile_list`, `profile_info`, `profile_create`, `profile_edit`, `profile_delete`
- Projects: `project_list`, `project_info`, `project_create`, `project_delete`
- Snapshots: `snapshot_list`, `snapshot_create`, `snapshot_restore`, `snapshot_delete`

## Claude Desktop / Claude Code

Example configuration (update the path as needed):

```json
{
  "mcpServers": {
    "incus": {
      "command": "bun",
      "args": ["run", "/absolute/path/to/incus-mcp/src/index.ts"],
      "env": {}
    }
  }
}
```
