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

- Remotes: `remote-list`, `remote-get-default`
- Instances: `instance-list`, `instance-info`, `instance-launch`, `instance-start`, `instance-stop`, `instance-delete`, `instance-exec`, `instance-rebuild`
- Images: `image-list`, `image-info`, `image-delete`
- Networks: `network-list`, `network-info`, `network-create`, `network-delete`
- Storage: `storage-pool-list`, `storage-pool-info`, `storage-volume-list`, `storage-volume-info`, `storage-volume-create`, `storage-volume-delete`
- Profiles: `profile-list`, `profile-info`, `profile-create`, `profile-edit`, `profile-delete`
- Projects: `project-list`, `project-info`, `project-create`, `project-delete`
- Snapshots: `snapshot-list`, `snapshot-create`, `snapshot-restore`, `snapshot-delete`

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
