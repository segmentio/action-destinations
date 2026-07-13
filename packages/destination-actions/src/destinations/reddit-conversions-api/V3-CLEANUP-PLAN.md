# Reddit Conversions API v3 — Cleanup Plan (post-promotion)

Executed **only after** v3 is validated, rolled out to 100%, and confirmed stable. Until then
the feature flag stays and v2 remains the default. Companion to
[`V3-ACTION-PLAN.md`](./V3-ACTION-PLAN.md).

The isolated-module architecture is designed so cleanup is **deletion, not surgery**. If any
step below requires editing shared logic line-by-line, the isolation was done wrong.

## Preconditions (all must be true before starting)

- [ ] v3 live-validated on a real pixel (flag on → 200, events visible in Event Testing).
- [ ] Flag `reddit-conversions-api-canary-version` at 100% in production for a soak period.
- [ ] No elevated error rates (esp. 400 validation) attributable to v3.
- [ ] Product sign-off to drop v2 support and to deprecate the `test_mode` setting.

## Cleanup steps

### A. Delete v2 code (pure deletion)

- [ ] Delete `v2/payload.ts` and `v2/types.ts`.
- [ ] Delete `versioning-info.ts` `REDDIT_CONVERSIONS_API_VERSION` (v2.0 constant) — or the
      whole file if nothing else uses it.

### B. Collapse the fork (small edit)

- [ ] In `utils.ts`, replace the `send()` fork with a direct call to the v3 sender.
- [ ] Delete `getApiVersion`, `isCanary`, `FLAGON_NAME`, `CANARY_API_VERSION`, `API_VERSION`.
- [ ] Promote `v3/` to be the primary implementation (optionally flatten `v3/` back up into
      the destination root now that there's only one version — naming cleanup, optional).

### C. testAuthentication (edit)

- [ ] `index.ts` `testAuthentication` currently posts a **v2** payload to the **v2** path.
      Repoint it to the v3 endpoint + v3 payload shape (or a minimal valid v3 event).
      **Do NOT include `test_id`** (production requests must omit it).

### D. Settings: deprecate `test_mode` (customer-visible — the one non-deletion step)

- [ ] Decide deprecation path for the `test_mode` boolean setting (it's v2-only). Options:
  - Remove it (breaking for saved configs that set it — coordinate with platform team), or
  - Mark hidden/deprecated and stop reading it.
- [ ] Remove the v3-migration NOTE comment above the setting once resolved.
- [ ] `test_id` optional field stays (it's the v3 mechanism); confirm docs tell customers to
      only use it for Event Testing and remove before production.

### E. Tests (delete + promote)

- [ ] Delete v2 regression tests and v2 URL/shape assertions.
- [ ] Promote v3 tests to primary; drop the flag-on/flag-off duplication (only one path left).
- [ ] Remove flag-toggling test helpers.

### F. Docs

- [ ] Delete `V3-MIGRATION.md`, `V3-ACTION-PLAN.md`, `V3-CLEANUP-PLAN.md` (planning artifacts).
- [ ] Keep or fold `V3-API-REFERENCE.md` into a concise implementation comment if still useful.
- [ ] Delete the stale `breaking-changes-analysis.md` if not already removed.
- [ ] Update the destination's public docs / changelog to reflect v3-only.

### G. Types + validation

- [ ] `yarn types` to regenerate `generated-types.ts` after field/settings changes.
- [ ] `yarn validate`, full test run, lint, typecheck.

## Rollback note

Because v2 lives entirely in `v2/` behind the fork, **rollback before cleanup** = flip the flag
off (instant, total). **After** cleanup (v2 deleted) rollback means a revert of the cleanup
commit — so do cleanup as a single, easily-revertable PR, and keep the soak period generous.

## Definition of done

- No references to `v2`, `FLAGON_NAME`, `getApiVersion`, or the canary flag remain
  (`grep -rn "FLAGON_NAME\|getApiVersion\|v2.0" reddit-conversions-api/` returns nothing).
- Single code path; all tests green; types regenerated; docs reflect v3-only.
