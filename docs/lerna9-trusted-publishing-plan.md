# Plan: Keyless npm Publishing via Lerna 9 OIDC Trusted Publishing

**Status:** Proposal — for team review
**Scope:** Move the publish path from long-lived `NPM_PUBLISH_TOKEN` to keyless
**npm OIDC trusted publishing** (+ provenance), staying on **yarn**.
**Related:** PR #3849 (Artifactory OIDC dependency resolution — already merged/in-flight).

---

## TL;DR

- Publishing keyless-ly does **not** require switching off yarn. Lerna performs the
  OIDC token exchange itself (via `libnpmpublish`), independent of the package manager.
- The blocker is the **Lerna version**: this repo is on **8.1.8**, which supports only
  _provenance-via-token_. Tokenless **OIDC trusted publishing landed in Lerna 9.0.0**.
- **60 public packages** must each be registered as a trusted publisher on npmjs.com
  (one entry per package — no org/scope shortcut). All already have
  `publishConfig.access = public`.

---

## Why yarn→npm is NOT part of this

Lerna uploads via `libnpmpublish` **in-process** — it never shells out to `npm publish`.
So the OIDC exchange is Lerna's own code path and runs the same regardless of whether
deps were installed with yarn or npm. Switching package managers moves us **zero steps**
closer to trusted publishing, while carrying high risk (`resolutions`→`overrides` glob
semantics, `--ignore-engines` loss, full lockfile re-QA across 63 workspaces). Keep yarn.

---

## Current state

| Aspect          | Today                                                                          |
| --------------- | ------------------------------------------------------------------------------ |
| Lerna           | `8.1.8`                                                                        |
| Node engine     | `^18.17 \|\| ^22.13`                                                           |
| Publish trigger | push to `main`/`hotfix/**` with commit message starting `Publish`              |
| Publish command | `yarn lerna publish from-package --yes --dist-tag latest`                      |
| Auth            | `NPM_PUBLISH_TOKEN` secret written to `~/.npmrc`                               |
| Public packages | **60** (3 private, all publishable ones already `publishConfig.access=public`) |

## Target state

| Aspect                     | Target                                                                      |
| -------------------------- | --------------------------------------------------------------------------- |
| Lerna                      | `>= 9.0.0`                                                                  |
| Node (publish job)         | `>= 22.14` (npm OIDC trusted publishing minimum; **not** 24)                |
| Auth                       | **none** — GitHub OIDC exchanged per-package for a short-lived npm token    |
| Provenance                 | auto-enabled (public repo + public package) — no `--provenance` flag needed |
| Secret `NPM_PUBLISH_TOKEN` | **removed**                                                                 |

---

## Requirements (confirmed against primary sources)

- **Lerna ≥ 9.0.0** — commit `d51e344` "feat: support OIDC trusted publishing"
  (v9.0.0, 2025-09-22). v8 has no `oidc.ts`.
- **npm registry minimums:** npm CLI ≥ 11.5.1, Node ≥ 22.14.0.
- **Per-package registration:** each package has exactly one trusted publisher
  (GitHub repo + workflow filename + environment). No scope/org-level config.
- CI publish job needs **`permissions: id-token: write`**.
- Refs: <https://lerna.js.org/docs/recipes/oidc-trusted-publishing> ·
  <https://docs.npmjs.com/trusted-publishers> ·
  example <https://github.com/JamesHenry/lerna-v9-oidc-publishing-example>

---

## Work plan

### Phase 0 — Prerequisites (out-of-repo, longest lead)

1. Decide the **publish workflow filename + environment name** now — they are
   load-bearing in every npm registration. Recommend keeping `publish.yml`.
2. Prepare the **60 trusted-publisher registrations** on npmjs.com (owner `segmentio`
   or `twilio` per npm org, repo `segmentio/action-destinations`, workflow `publish.yml`).
   Script the list from the 60 public `package.json` names. This is the bulk manual step.
3. Confirm the npm org allows OIDC trusted publishing for these packages.

### Phase 1 — Lerna 8 → 9 upgrade (functional, no auth change yet)

4. Bump `lerna` to `^9` (root `devDependencies`); run `yarn install`, refresh `yarn.lock`.
5. Review Lerna 9 breaking changes against our usage:
   - `lerna version` (used in `version-packages.yml`, `release.sh`, `scripts/canary.sh`)
   - `lerna publish from-package` (used in `publish.yml`, `publish-canary.yml`)
   - `lerna run` / `lerna changed` (used in `typecheck`, `test-partners`, CI validate)
6. Keep token-based publishing working through this phase (de-risk: upgrade and publish
   changes are separate, revertible commits).
7. Full CI green on a branch before touching auth.

### Phase 2 — Switch publish.yml to OIDC (keyless)

8. In `publish.yml` deploy job: add `permissions: { id-token: write, contents: read }`,
   set Node `>= 22.14`, **remove** the `Set NPM Token` step and `NPM_PUBLISH_TOKEN`.
9. Keep `lerna publish from-package --yes` — Lerna 9 auto-detects Actions OIDC, does the
   per-package exchange, and enables provenance for public packages.
10. Repeat for `publish-canary.yml` (staging → `--dist-tag canary`).
11. Bump `engines.node` lower bound if needed to satisfy ≥ 22.14 on the publish path.

### Phase 3 — Validate & clean up

12. Dry-run / canary publish first (staging branch) — verify provenance badge appears.
13. Confirm a real `latest` publish of one package end-to-end before trusting the fleet.
14. Delete the `NPM_PUBLISH_TOKEN` repo secret once green.

---

## Risks & mitigations

| Risk                                                  | Mitigation                                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Lerna 9 breaking changes to `version`/`publish`/`run` | Phase 1 upgrade isolated from auth change; full CI before Phase 2                    |
| 60 registrations is tedious / error-prone             | Script the package list; registration mismatch fails loudly at publish, not silently |
| Node 22.14 floor vs engine `^22.13`                   | Narrow bump on publish job first; widen `engines` only if needed                     |
| A package added later without registration            | Publish fails for that package with a clear OIDC error — add registration then       |
| Provenance requires public repo — repo is public ✓    | No action                                                                            |

## Open questions for the team

- Which npm org owns `@segment/*` — and does it have trusted publishing enabled?
- Are we comfortable with the Node ≥ 22.14 floor on the publish runner?
- Keep `publish.yml` name (avoids re-registering) — agreed?

## Explicitly out of scope

- yarn → npm package-manager migration (separate effort; no bearing on publishing).
- ADR 1634 build-attestation / internal security-clearance gate (not yet available;
  a versioned reusable workflow is planned upstream).
