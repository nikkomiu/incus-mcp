# GitHub Actions — Build & Release Plan

## Context

Set up GitHub Actions for **incus-mcp** so every push and pull request type-checks, lints, and builds the Bun-powered MCP server into a standalone binary. For version tags, publish those binaries to the matching GitHub release so contributors can download ready-to-run artifacts without installing Bun.

## Project Structure

```
incus-mcp/
├── .github/
│   └── workflows/
│       └── build.yml          (new — CI build, test, and release workflow)
├── package.json               (existing — provides build/type-check/lint scripts)
├── src/                       (entrypoint at src/index.ts)
└── dist/                      (output — compiled binaries per OS)
```

## Design Decisions

- **Single-binary build** — continue using `bun build src/index.ts --compile --outfile dist/incus-mcp` so CI emits a self-contained executable.
- **Artifact naming** — append OS/arch suffixes in workflow (e.g., `dist/incus-mcp-macos`). Keep the package script generic so local builds stay simple.
- **Quality gates first** — run `bun run type-check` and `bun run lint` before building to catch issues quickly.
- **Matrix builds** — cover `ubuntu-latest` and `macos-latest` (matching Bun's supported targets for Incus users). Add Windows later if the CLI gains support.
- **Tag-driven releases** — only publish artifacts for tags matching `v*` to keep draft releases clean.
- **Release publishing** — leverage `gh release upload` with repo-scoped `GITHUB_TOKEN`; set `permissions: contents: write` on jobs that upload assets.

## Implementation Steps

### 1. Confirm `package.json` scripts

The repo already exposes the commands CI needs:

- `bun run type-check` — TypeScript gating
- `bun run lint` — Biome lint pass
- `bun run build` — Creates `dist/incus-mcp`

Document these in the README (if not already) so local contributors run the same steps the workflow enforces.

### 2. Create GitHub Actions workflow

Add `.github/workflows/build.yml`:

- **Triggers** — `pull_request` targeting `main`, `push` to `main`, and `push` tags matching `v*`.
- **Jobs**
  - `build` (matrix of `ubuntu-latest` & `macos-latest`)
    1. `actions/checkout`
    2. `oven-sh/setup-bun` (`bun-version: latest`)
    3. `bun install --frozen-lockfile` (ensures `bun.lockb` consistency)
    4. `bun run type-check`
    5. `bun run lint`
    6. `bun run build`
    7. Rename artifacts (e.g., `mv dist/incus-mcp dist/incus-mcp-${{ matrix.os }}`)
    8. `actions/upload-artifact` with name `incus-mcp-${{ matrix.os }}`
  - `release` (runs only on `v*` tags)
    1. Needs `build`
    2. Download artifacts
    3. Use `gh release create` (if release absent) and `gh release upload --clobber dist/*`
    4. Set `env: GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` and permissions `contents: write`

Matrix runners inherit the GitHub token automatically; no additional secrets are required.

### 3. Ignore build outputs locally

Ensure `.gitignore` includes `dist/` so local binaries are never committed. CI artifacts are captured solely through the workflow.

## Verification

1. Local build: `bun run build` produces `dist/incus-mcp` and the binary executes `./dist/incus-mcp --help` without errors.
2. Local quality gates: `bun run type-check` and `bun run lint` pass.
3. CI dry run (branch/PR): workflow uploads per-OS artifacts and surfaces lint/type errors inline if they fail.
4. CI tag run: pushing `v0.1.0` triggers release job, which creates/updates the `v0.1.0` release and attaches the `incus-mcp-<os>` binaries.
