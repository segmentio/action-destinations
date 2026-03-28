# Design: Migrate from Yarn Classic to pnpm

Date: 2026-03-19

## Context

This repo currently uses Yarn Classic (v1), which is in maintenance-only mode. This design covers
migrating to pnpm while keeping Lerna v8 + NX as the monorepo orchestration layer.

## Goals

- Replace Yarn Classic with pnpm for both local development and CI/CD
- Preserve all existing script interfaces as closely as possible
- Use `shamefully-hoist=true` initially for compatibility; can be tightened later

## Out of scope

- Replacing Lerna or NX
- Tightening pnpm strictness (phantom dep cleanup)
- Migrating internal package refs to `workspace:*` protocol

---

## Changes

### New files

**`pnpm-workspace.yaml`**

```yaml
packages:
  - 'packages/*'
  - 'packages/browser-destinations/destinations/*'
```

**`.npmrc`** (replace existing content)

```ini
shamefully-hoist=true
strict-peer-dependencies=false
```

### `package.json`

- Remove `"workspaces"` object (moved to `pnpm-workspace.yaml`)
- Rename `"resolutions"` → `"pnpm": { "overrides": { ... } }`
- Update all `yarn workspace @segment/X` script shortcuts to `pnpm --filter @segment/X`
- Add `"packageManager": "pnpm@10.x.x"`

### `lerna.json`

- `"npmClient": "yarn"` → `"npmClient": "pnpm"`
- Remove `"bootstrap"` section

### GitHub Actions workflows (7 files)

All 7 workflows that reference yarn need:

1. Add `pnpm/action-setup@v4` step before `actions/setup-node`
2. `cache: yarn` → `cache: pnpm` in `actions/setup-node`
3. `yarn install --frozen-lockfile` → `pnpm install --frozen-lockfile`
4. All `yarn <cmd>` → `pnpm <cmd>`

Files: `ci.yml`, `ext.yml`, `publish.yml`, `publish-canary.yml`,
`version-packages.yml`, `required-field-check.yml`, `required-secret-check.yml`

`configure-pr.yml` — no changes needed (no yarn references)

### Shell scripts

| File                                 | Change                                                          |
| ------------------------------------ | --------------------------------------------------------------- |
| `scripts/assert-lockfile-updated.sh` | `yarn install` → `pnpm install`; `yarn.lock` → `pnpm-lock.yaml` |
| `scripts/canary.sh`                  | `npx lerna` → `pnpm exec lerna`                                 |
| `scripts/release.sh`                 | `lerna version` → `pnpm exec lerna version`                     |
| `scripts/test-browser.sh`            | `lerna run` → `pnpm exec lerna run`                             |

### Lockfile

- Delete `yarn.lock`
- Run `pnpm install` to generate `pnpm-lock.yaml`

### `CLAUDE.md`

Update all `yarn` command examples to `pnpm` equivalents.

---

## Risk areas

- **Hoisting differences**: mitigated by `shamefully-hoist=true`
- **Lerna + pnpm**: Lerna v8 has pnpm support; `npmClient: pnpm` is the documented path
- **Large lockfile diff**: expected; one-time cost
