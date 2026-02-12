# RFD 0002: All-Projects Default Project Flag

## Context

Tooling currently passes `--project <name>` only when the caller provides a project parameter. For list and info style commands, this means results default to the active project rather than all projects. We want the MCP server to default to `--all-projects` when no project is specified, but only for Incus commands that support it and only where it is safe (read-only operations). Mutating commands should remain scoped to explicit projects.

## Project Structure

```
incus-mcp/
└── src/
    └── tools/
        ├── utils.ts        (update — add allow-all-projects option)
        ├── instances.ts    (update — read-only commands)
        ├── images.ts       (update — read-only commands)
        ├── networks.ts     (update — read-only commands)
        ├── storage.ts      (update — read-only commands)
        ├── profiles.ts     (update — read-only commands)
        └── snapshots.ts    (update — read-only commands)
```

## Design Decisions

- **Explicit project wins**: If `project` is provided, always pass `--project <name>`.
- **Read-only only**: Use `--all-projects` only for list/show/info operations that are safe and supported by the Incus CLI.
- **Centralized flag logic**: Extend the `addProjectFlag` helper to avoid repeating decision logic in each tool.
- **Compatibility**: Keep the default behavior unchanged for mutating commands (create, delete, launch, start, stop, rebuild, exec).

## Implementation Steps

### 1. Validate which commands accept `--all-projects`

Review Incus CLI help (or docs) for each command currently using `addProjectFlag` to confirm whether `--all-projects` is supported. Record which commands are safe and supported.

### 2. Extend `addProjectFlag`

Update `addProjectFlag` in `src/tools/utils.ts` to accept an options object:

- If `project` is provided, append `--project <name>`.
- Otherwise, if `{ allowAllProjects: true }` is provided, append `--all-projects`.

### 3. Enable all-projects on read-only tools

Update read-only tool handlers to pass `{ allowAllProjects: true }` when calling `addProjectFlag`.

Examples (pending CLI support confirmation):

- `instance-list`, `instance-info`
- `image-list`, `image-info`
- `network-list`, `network-info`
- `storage-pool-list`, `storage-pool-info`, `storage-volume-list`, `storage-volume-info`
- `profile-list`, `profile-info`
- `snapshot-list`

Leave mutating tools unchanged so they only operate on the default or explicit project.

## Verification

1. `bun run type-check`
2. Run a few list/info tools without a project to confirm output includes resources from multiple projects where Incus supports the flag.
3. Run a mutating command without a project and confirm it still targets the default project only.
