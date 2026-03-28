# Yarn to pnpm Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Yarn Classic (v1) with pnpm across the entire monorepo — local dev and all CI/CD workflows.

**Architecture:** Keep Lerna v8 + NX as the monorepo orchestration layer; only swap the package manager. Use `shamefully-hoist=true` in `.npmrc` for a safe first migration (preserves Yarn Classic hoisting behavior). Workspace definition moves from `package.json` to a dedicated `pnpm-workspace.yaml`. The `resolutions` field becomes `pnpm.overrides`.

**Tech Stack:** pnpm@8.6.10 (locally installed), Lerna v8, NX, GitHub Actions (`pnpm/action-setup@v4`)

---

### Task 1: Create `pnpm-workspace.yaml`

**Files:**

- Create: `pnpm-workspace.yaml`

**Step 1: Create the file**

```yaml
packages:
  - 'packages/*'
  - 'packages/browser-destinations/destinations/*'
```

**Step 2: Verify it exists**

Run: `cat pnpm-workspace.yaml`
Expected: the two package globs printed

**Step 3: Commit**

```bash
git add pnpm-workspace.yaml
git commit -m "chore: add pnpm-workspace.yaml"
```

---

### Task 2: Update `.npmrc`

**Files:**

- Modify: `.npmrc`

**Step 1: Replace contents**

New content (replace the existing `package-lock=false` line):

```ini
shamefully-hoist=true
strict-peer-dependencies=false
```

> `shamefully-hoist=true` replicates Yarn Classic's flat node_modules hoisting.
> `strict-peer-dependencies=false` avoids install failures on peer dep warnings.
> The `package-lock=false` npm setting is irrelevant with pnpm so remove it.

**Step 2: Verify**

Run: `cat .npmrc`
Expected: two lines shown above

**Step 3: Commit**

```bash
git add .npmrc
git commit -m "chore: update .npmrc for pnpm"
```

---

### Task 3: Update `package.json` — workspaces + resolutions + packageManager

**Files:**

- Modify: `package.json`

**Step 1: Remove the `workspaces` object**

Delete these lines from `package.json`:

```json
"workspaces": {
  "packages": [
    "packages/*",
    "packages/browser-destinations/destinations/*"
  ]
},
```

**Step 2: Replace `resolutions` with `pnpm.overrides`**

Before:

```json
"resolutions": {
  "**/@size-limit/preset-small-lib/**/glob-parent": "^6.0.1",
  "**/analytics-next/**/dot-prop": "^4.2.1",
  "ansi-regex": "5.0.1",
  "@babel/core/semver": "6.3.1",
  "@babel/helper-compilation-targets/semver": "6.3.1",
  "istanbul-lib-instrument/semver": "6.3.1"
},
```

After:

```json
"pnpm": {
  "overrides": {
    "**/@size-limit/preset-small-lib/**/glob-parent": "^6.0.1",
    "**/analytics-next/**/dot-prop": "^4.2.1",
    "ansi-regex": "5.0.1",
    "@babel/core/semver": "6.3.1",
    "@babel/helper-compilation-targets/semver": "6.3.1",
    "istanbul-lib-instrument/semver": "6.3.1"
  }
},
```

**Step 3: Add `packageManager` field**

Add after the `"license"` field:

```json
"packageManager": "pnpm@8.6.10",
```

**Step 4: Update `scripts` — replace `yarn workspace` with `pnpm --filter`**

| Before                                                                 | After                                                                 |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `"browser": "yarn workspace @segment/browser-destinations"`            | `"browser": "pnpm --filter @segment/browser-destinations"`            |
| `"cli": "yarn workspace @segment/actions-cli"`                         | `"cli": "pnpm --filter @segment/actions-cli"`                         |
| `"cloud": "yarn workspace @segment/action-destinations"`               | `"cloud": "pnpm --filter @segment/action-destinations"`               |
| `"warehouse": "yarn workspace @segment/warehouse-destinations"`        | `"warehouse": "pnpm --filter @segment/warehouse-destinations"`        |
| `"core": "yarn workspace @segment/actions-core"`                       | `"core": "pnpm --filter @segment/actions-core"`                       |
| `"shared": "yarn workspace @segment/actions-shared"`                   | `"shared": "pnpm --filter @segment/actions-shared"`                   |
| `"subscriptions": "yarn workspace @segment/destination-subscriptions"` | `"subscriptions": "pnpm --filter @segment/destination-subscriptions"` |

Also update `build`, `clean-build`, `test-partners`, `typecheck` to replace `yarn` with `pnpm`:

```json
"build": "nx run-many -t build && pnpm build:browser-bundles",
"clean-build": "pnpm clean && pnpm build",
"build:browser-bundles": "nx build @segment/destinations-manifest && nx build-web @segment/browser-destinations",
"canary": "./scripts/canary.sh",
"clean": "sh scripts/clean.sh",
"test": "nx run-many -t test",
"test:clear-cache": "nx clear-cache",
"test-browser": "bash scripts/test-browser.sh",
"test-partners": "lerna run test --stream --ignore @segment/actions-core --ignore @segment/actions-cli --ignore @segment/ajv-human-errors",
"typecheck": "lerna run typecheck --stream",
"types": "./bin/run generate:types",
"validate": "./bin/run validate",
"alpha": "lerna version prerelease --allow-branch $(git branch --show-current) --preid $(git branch --show-current) --no-push --no-git-tag-version",
"postversion": "bash scripts/postversion.sh",
"prepare": "husky install",
"release": "bash scripts/release.sh",
"lint": "ls -d ./packages/* | xargs -I {} eslint '{}/**/*.ts' --cache"
```

**Step 5: Verify JSON is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('valid')"`
Expected: `valid`

**Step 6: Commit**

```bash
git add package.json
git commit -m "chore: migrate package.json from yarn to pnpm"
```

---

### Task 4: Update `lerna.json`

**Files:**

- Modify: `lerna.json`

**Step 1: Update npmClient and remove bootstrap section**

Before:

```json
{
  "packages": ["packages/*", "packages/browser-destinations/destinations/*"],
  "npmClient": "yarn",
  "version": "independent",
  "command": {
    "bootstrap": {
      "npmClientArgs": ["--ignore-engines", "--ignore-optional"]
    },
    "version": {
      "allowBranch": ["main", "hotfix/*"]
    }
  }
}
```

After:

```json
{
  "packages": ["packages/*", "packages/browser-destinations/destinations/*"],
  "npmClient": "pnpm",
  "version": "independent",
  "command": {
    "version": {
      "allowBranch": ["main", "hotfix/*"]
    }
  }
}
```

**Step 2: Verify JSON is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('lerna.json','utf8')); console.log('valid')"`
Expected: `valid`

**Step 3: Commit**

```bash
git add lerna.json
git commit -m "chore: update lerna.json to use pnpm"
```

---

### Task 5: Update `scripts/assert-lockfile-updated.sh`

**Files:**

- Modify: `scripts/assert-lockfile-updated.sh`

**Step 1: Replace contents**

```sh
#!/bin/sh
# asserts lockfile is up-to-date with pnpm --frozen-lockfile behavior

pnpm install --frozen-lockfile

git diff pnpm-lock.yaml
if ! git diff --exit-code pnpm-lock.yaml; then
  echo "Changes were detected in pnpm-lock.yaml file after running 'pnpm install', which is not expected. Please run 'pnpm install' locally and commit the changes."
  exit 1
fi
```

**Step 2: Commit**

```bash
git add scripts/assert-lockfile-updated.sh
git commit -m "chore: update assert-lockfile script for pnpm"
```

---

### Task 6: Update `scripts/canary.sh`

**Files:**

- Modify: `scripts/canary.sh`

**Step 1: Replace `npx lerna` with `pnpm exec lerna`**

Before:

```bash
npx lerna publish --canary --preid "$branch" --include-merged-tags
```

After:

```bash
pnpm exec lerna publish --canary --preid "$branch" --include-merged-tags
```

**Step 2: Commit**

```bash
git add scripts/canary.sh
git commit -m "chore: update canary.sh for pnpm"
```

---

### Task 7: Update `scripts/release.sh`

**Files:**

- Modify: `scripts/release.sh`

**Step 1: Replace `lerna version` with `pnpm exec lerna version`**

Before:

```bash
lerna version minor --no-private -y
```

After:

```bash
pnpm exec lerna version minor --no-private -y
```

**Step 2: Commit**

```bash
git add scripts/release.sh
git commit -m "chore: update release.sh for pnpm"
```

---

### Task 8: Update `scripts/test-browser.sh`

**Files:**

- Modify: `scripts/test-browser.sh`

**Step 1: Replace `lerna run` with `pnpm exec lerna run`**

Before:

```bash
lerna run build:karma --stream && NODE_OPTIONS=--openssl-legacy-provider karma start;
...
lerna run build:karma --stream && karma start;
```

After:

```bash
pnpm exec lerna run build:karma --stream && NODE_OPTIONS=--openssl-legacy-provider karma start;
...
pnpm exec lerna run build:karma --stream && karma start;
```

**Step 2: Commit**

```bash
git add scripts/test-browser.sh
git commit -m "chore: update test-browser.sh for pnpm"
```

---

### Task 9: Update `.github/workflows/ci.yml`

**Files:**

- Modify: `.github/workflows/ci.yml`

**Step 1: For the `test` job — add pnpm setup, update cache + install**

Add this step immediately before the `actions/setup-node` step:

```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@v4
  with:
    version: 8
```

Change the `actions/setup-node` step from `cache: yarn` to `cache: pnpm`.

Change:

```yaml
- name: Install Dependencies
  run: yarn install --frozen-lockfile
```

To:

```yaml
- name: Install Dependencies
  run: pnpm install --frozen-lockfile
```

Change `yarn nx` to `pnpm nx` in the Build and Test steps:

```yaml
- name: Build (Affected)
  run: NODE_ENV=production pnpm nx affected -t build --parallel=3

- name: Test (Affected)
  run: pnpm nx affected -t test --parallel=3 --coverage
```

**Step 2: Repeat for `lint` job**

- Add `pnpm/action-setup@v4` step
- `cache: yarn` → `cache: pnpm`
- `yarn install --frozen-lockfile` → `pnpm install --frozen-lockfile`
- `yarn build` → `pnpm build`
- `yarn lint` → `pnpm lint`

**Step 3: Repeat for `validate` job**

- Add `pnpm/action-setup@v4` step
- `cache: yarn` → `cache: pnpm`
- `yarn install --frozen-lockfile` → `pnpm install --frozen-lockfile`
- Update `assert-lockfile-updated.sh` step name comment (it checks `pnpm-lock.yaml` now)
- `yarn build` → `pnpm build`
- `yarn validate` → `pnpm validate`
- `yarn subscriptions size` → `pnpm subscriptions size`

**Step 4: Repeat for `browser-destination-bundle-qa` job**

- Add `pnpm/action-setup@v4` step
- `cache: yarn` → `cache: pnpm`
- `yarn install --frozen-lockfile` → `pnpm install --frozen-lockfile`
- `yarn build:browser-bundles` → `pnpm build:browser-bundles`
- `yarn browser size` → `pnpm browser size`

**Step 5: Update `browser-tests-core` job**

This job uses the old manual cache approach. Replace the entire cache setup block:

Remove:

```yaml
- name: Get yarn cache directory path
  id: yarn-cache-dir-path
  run: echo "::set-output name=dir::$(yarn cache dir)"

- uses: actions/cache@v3
  id: yarn-cache
  with:
    path: ${{ steps.yarn-cache-dir-path.outputs.dir }}
    key: ${{ runner.os }}-yarn-${{ hashFiles('**/yarn.lock') }}
    restore-keys: |
      ${{ runner.os }}-yarn-
```

Replace with:

```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@v4
  with:
    version: 8
```

And update `actions/setup-node` to `v4` with `cache: pnpm`.

Then:

- `yarn install --frozen-lockfile` → `pnpm install --frozen-lockfile`
- `yarn lerna run build ...` → `pnpm exec lerna run build ...`
- `yarn test-browser` → `pnpm test-browser`

**Step 6: Update `snyk` job** (same manual cache pattern as `browser-tests-core`)

Remove the yarn cache block, add `pnpm/action-setup@v4`, update `setup-node` to `v4` with `cache: pnpm`.

- `yarn install --frozen-lockfile` → `pnpm install --frozen-lockfile`

**Step 7: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "chore: migrate ci.yml to pnpm"
```

---

### Task 10: Update `.github/workflows/ext.yml`

**Files:**

- Modify: `.github/workflows/ext.yml`

**Step 1: Update the single job**

- Add `pnpm/action-setup@v4` step before `actions/setup-node`
- `cache: yarn` → `cache: pnpm`
- `yarn install --frozen-lockfile` → `pnpm install --frozen-lockfile`
- `yarn test` → `pnpm test`
- `yarn build` → `pnpm build`

**Step 2: Commit**

```bash
git add .github/workflows/ext.yml
git commit -m "chore: migrate ext.yml to pnpm"
```

---

### Task 11: Update `.github/workflows/publish.yml`

**Files:**

- Modify: `.github/workflows/publish.yml`

**Step 1: Add pnpm setup + update install + commands**

- Add `pnpm/action-setup@v4` step before `actions/setup-node`
- `cache: yarn` → `cache: pnpm`
- `yarn install --frozen-lockfile` → `pnpm install --frozen-lockfile`
- `yarn build` → `pnpm build`
- `yarn lerna publish from-package ...` → `pnpm lerna publish from-package ...`

**Step 2: Commit**

```bash
git add .github/workflows/publish.yml
git commit -m "chore: migrate publish.yml to pnpm"
```

---

### Task 12: Update `.github/workflows/publish-canary.yml`

**Files:**

- Modify: `.github/workflows/publish-canary.yml`

**Step 1: Add pnpm setup + update install + commands**

- Add `pnpm/action-setup@v4` step before `actions/setup-node`
- `cache: yarn` → `cache: pnpm`
- `yarn install --frozen-lockfile` → `pnpm install --frozen-lockfile`
- `yarn build` → `pnpm build`
- `yarn lerna publish from-package ...` → `pnpm lerna publish from-package ...`

**Step 2: Commit**

```bash
git add .github/workflows/publish-canary.yml
git commit -m "chore: migrate publish-canary.yml to pnpm"
```

---

### Task 13: Update `.github/workflows/version-packages.yml`

**Files:**

- Modify: `.github/workflows/version-packages.yml`

**Step 1: Add pnpm setup + update install + commands**

- Add `pnpm/action-setup@v4` step before `actions/setup-node`
- `cache: yarn` → `cache: pnpm`
- `yarn install --frozen-lockfile` → `pnpm install --frozen-lockfile`
- `yarn build` → `pnpm build`
- `yarn lerna version minor ...` → `pnpm lerna version minor ...`
- `yarn lerna version patch ...` → `pnpm lerna version patch ...`

**Step 2: Commit**

```bash
git add .github/workflows/version-packages.yml
git commit -m "chore: migrate version-packages.yml to pnpm"
```

---

### Task 14: Update `.github/workflows/required-field-check.yml`

**Files:**

- Modify: `.github/workflows/required-field-check.yml`

**Step 1: Add pnpm setup + update install**

- Add `pnpm/action-setup@v4` step before `actions/setup-node`
- `cache: yarn` → `cache: pnpm`
- Both occurrences of `yarn install --frozen-lockfile` → `pnpm install --frozen-lockfile`
  (there are two: one at the top, one in the "Check for required fields on main branch" step)

**Step 2: Commit**

```bash
git add .github/workflows/required-field-check.yml
git commit -m "chore: migrate required-field-check.yml to pnpm"
```

---

### Task 15: Update `.github/workflows/required-secret-check.yml`

**Files:**

- Modify: `.github/workflows/required-secret-check.yml`

**Step 1: Add pnpm setup + update install**

- Add `pnpm/action-setup@v4` step before `actions/setup-node`
- `cache: yarn` → `cache: pnpm`
- `yarn install --frozen-lockfile` → `pnpm install --frozen-lockfile`

**Step 2: Commit**

```bash
git add .github/workflows/required-secret-check.yml
git commit -m "chore: migrate required-secret-check.yml to pnpm"
```

---

### Task 16: Generate `pnpm-lock.yaml` and delete `yarn.lock`

**Files:**

- Delete: `yarn.lock`
- Generate: `pnpm-lock.yaml`

**Step 1: Delete yarn.lock**

```bash
rm yarn.lock
```

**Step 2: Install with pnpm to generate lockfile**

```bash
pnpm install
```

Expected: pnpm resolves all packages, creates `pnpm-lock.yaml`, populates `node_modules`.
This may take a few minutes on first run (cold store).

If you see peer dependency warnings, they are expected and safe to ignore (covered by `strict-peer-dependencies=false`).
If you see hard errors, check the error message — common causes:

- A package requires a hoisted dep that isn't found: add it to `pnpm.overrides` in `package.json`
- Version conflict: resolve in `pnpm.overrides`

**Step 3: Commit**

```bash
git add pnpm-lock.yaml
git rm yarn.lock
git commit -m "chore: replace yarn.lock with pnpm-lock.yaml"
```

---

### Task 17: Verify the installation works

**Step 1: Run a build**

```bash
pnpm build
```

Expected: NX runs builds across affected packages, exits 0.

**Step 2: Run tests for one package**

```bash
pnpm cloud jest --testPathPattern="slack" --passWithNoTests
```

Expected: tests pass.

**Step 3: Verify workspace filter works**

```bash
pnpm --filter @segment/actions-core run build
```

Expected: builds `@segment/actions-core`, exits 0.

**Step 4: Commit if any fixups were needed**

```bash
git add -A
git commit -m "chore: fix pnpm install issues"
```

---

### Task 18: Update `CLAUDE.md`

**Files:**

- Modify: `CLAUDE.md`

**Step 1: Replace all `yarn` command references with `pnpm` equivalents**

Key substitutions in the "Common Commands" section:

| Before                       | After                        |
| ---------------------------- | ---------------------------- |
| `yarn build`                 | `pnpm build`                 |
| `yarn clean-build`           | `pnpm clean-build`           |
| `yarn cloud build`           | `pnpm cloud build`           |
| `yarn browser build-web`     | `pnpm browser build-web`     |
| `yarn core build`            | `pnpm core build`            |
| `yarn build:browser-bundles` | `pnpm build:browser-bundles` |
| `yarn test`                  | `pnpm test`                  |
| `yarn test:clear-cache`      | `pnpm test:clear-cache`      |
| `yarn cloud test`            | `pnpm cloud test`            |
| `yarn browser test`          | `pnpm browser test`          |
| `yarn core test`             | `pnpm core test`             |
| `yarn test-browser`          | `pnpm test-browser`          |
| `yarn test-partners`         | `pnpm test-partners`         |
| `yarn cloud jest ...`        | `pnpm cloud jest ...`        |
| `yarn browser jest ...`      | `pnpm browser jest ...`      |
| `yarn core jest ...`         | `pnpm core jest ...`         |
| `yarn lint`                  | `pnpm lint`                  |
| `yarn typecheck`             | `pnpm typecheck`             |
| `yarn types`                 | `pnpm types`                 |
| `yarn validate`              | `pnpm validate`              |
| `TZ=UTC yarn cloud test`     | `TZ=UTC pnpm cloud test`     |
| `yarn install`               | `pnpm install`               |

Also update the "install" command in the Development Workflow section.

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md commands from yarn to pnpm"
```

---

## Verification Checklist

After all tasks are complete, verify:

- [ ] `pnpm install` runs without errors
- [ ] `pnpm build` succeeds
- [ ] `pnpm test` runs (at least one package)
- [ ] `pnpm --filter @segment/actions-core run build` works
- [ ] `pnpm lint` runs without errors
- [ ] `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"` — valid JSON
- [ ] `node -e "JSON.parse(require('fs').readFileSync('lerna.json','utf8'))"` — valid JSON
- [ ] `yarn.lock` is gone, `pnpm-lock.yaml` exists
- [ ] No remaining `yarn` references in `.github/workflows/` (except comments)
- [ ] No remaining `yarn` references in `scripts/`
