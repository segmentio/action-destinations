# Reddit Conversions API v3 — Implementation Action Plan

Companion to [`V3-MIGRATION.md`](./V3-MIGRATION.md) (the breaking-changes analysis).
This doc is the **how**: the chosen architecture and the concrete, ordered change list.

## Chosen approach

**Feature-flag gated, with all v3 logic isolated in its own module, shared by both actions.**

- Flag: `reddit-conversions-api-canary-version` (already exists).
- Flag OFF (default) → today's v2.0 behavior, byte-for-byte unchanged.
- Flag ON → v3 endpoint + v3 payload.
- v2 and v3 code live in **separate files** — no inline `if (v3)` branching in shared logic.
- **Cleanup = delete the v2 files + the fork.** No untangling, no code duplication left behind.

### Why this over separate v3 actions

- The two actions (`standardEvent`, `customEvent`) differ by exactly one field; the v3
  transform is ~90% shared — duplicating it across new actions is worse.
- New actions **cannot inherit existing customer mappings** (subscriptions reference a fixed
  `partnerAction` key) — every customer would have to manually rebuild mappings, risking
  event loss / dual-sending (which Reddit explicitly warns against).
- The flag gives percentage rollout + instant rollback for free (Reddit's recommended path).

---

## Target file layout

```
reddit-conversions-api/
  index.ts                # settings, testAuthentication (v2-pinned), presets, actions
  fields.ts               # shared input fields (+ new optional v3 fields, additive)
  utils.ts                # send(): the SINGLE flag fork → delegates to v2 or v3
  versioning-info.ts      # version constants (unchanged)

  v2/
    payload.ts            # today's createRedditPayload + send URL (moved verbatim)
    types.ts              # today's StandardEventPayload/Item (moved from types.ts)

  v3/
    payload.ts            # NEW: createRedditPayloadV3 + v3 URL builder
    types.ts              # NEW: RedditV3Payload / RedditV3Event
    tracking-type-map.ts  # NEW: v2→v3 UPPER_SNAKE enum map

  standardEvent/index.ts  # unchanged (still calls send())
  customEvent/index.ts    # unchanged (still calls send())
  __tests__/              # v2 regression tests + new v3 tests
```

**Cleanup at flag removal** = delete `v2/`, collapse `send()` to call v3 directly, delete the
flag constant + `getApiVersion`, delete v2 tests. Mechanical.

---

## The single fork (heart of the design)

```ts
// utils.ts
import { sendV2 } from './v2/payload'
import { sendV3 } from './v3/payload'

export function isCanary(features?: Features): boolean {
  return !!(features && features[FLAGON_NAME])
}

export async function send(request, settings, payload, features) {
  return isCanary(features) ? sendV3(request, settings, payload) : sendV2(request, settings, payload)
}
```

Actions are untouched — they already pass `features` into `send()`.

---

## Ordered change list

### Phase 0 — Reset the known-bad state

- [ ] Revert/replace the `wip` commit's wrong v3 URL
      (`ad_accounts/{id}/conversions/events` → will be replaced by the correct v3 builder).
- [ ] Keep the flag scaffolding (`versioning-info.ts`, `getApiVersion`, flag threading, v2 tests).

### Phase 1 — Extract v2 (no behavior change)

- [ ] Create `v2/payload.ts`: move `createRedditPayload` + the v2 URL
      (`/api/v2.0/conversions/events/{pixel}`) into `sendV2()`.
- [ ] Create `v2/types.ts`: move `StandardEventPayload` / `StandardEventPayloadItem`.
- [ ] Reduce `utils.ts` to shared helpers (hashing, clean, getUser/getMetadata if shared) +
      the `send()` fork. Decide which helpers are shared vs v2-only (hashing is shared).
- [ ] Run tests — must be green with **zero** payload changes (pure refactor).

### Phase 2 — Build v3 payload module

- [ ] `v3/tracking-type-map.ts`: map `PageVisit→PAGE_VISIT`, `ViewContent→VIEW_CONTENT`,
      `Search→SEARCH`, `AddToCart→ADD_TO_CART`, `AddToWishlist→ADD_TO_WISHLIST`,
      `Purchase→PURCHASE`, `Lead→LEAD`, `SignUp→SIGN_UP`, `Custom→CUSTOM`.
- [ ] `v3/types.ts`: `RedditV3Payload { data: { events: RedditV3Event[]; partner: 'SEGMENT'; test_id?: string } }`,
      `RedditV3Event { event_at: number; type: {...}; metadata?: {...}; user?: {...}; action_source: string; event_source_url?: string; click_id?: string }`.
- [ ] `v3/payload.ts` — `sendV3()`:
  - URL: `https://ads-api.reddit.com/api/v3/pixels/${settings.ad_account_id}/conversion_events`
  - Envelope: `{ data: { events, partner: 'SEGMENT', test_id? } }`
  - Per event:
    - `event_at` → **epoch ms integer** (`new Date(iso).getTime()`)
    - `event_type` → `type`; `tracking_type` mapped via the enum table (custom → `CUSTOM`)
    - `event_metadata` → `metadata`; `value_decimal` → `value` (double)
    - `action_source` (see Decision 1)
    - `event_source_url` when present
  - Reuse shared hashing/clean helpers (do NOT duplicate hashing logic).

### Phase 3 — Fields (additive, schema-level — see decisions)

- [ ] `fields.ts`: add **optional** `action_source` (default `WEBSITE`) — Decision 1.
- [ ] `fields.ts`: add **optional** `event_source_url` (default `$.context.page.url`).
- [ ] `index.ts` or `fields.ts`: add **optional** `test_id` — Decision 2.
- [ ] Keep `tracking_type` field choices in **v2 casing** (customer-facing labels unchanged);
      UPPER_SNAKE conversion happens inside `v3/payload.ts` only.
- [ ] `yarn types` to regenerate `generated-types.ts`.

### Phase 4 — Error handling

- [ ] Review v3 `Post Conversion Events` response spec (wide range of status codes).
- [ ] Map v3 responses to core error classes (`RetryableError`, `PayloadValidationError`,
      `InvalidAuthenticationError`) in `sendV3()` / a shared error handler.

### Phase 5 — Tests

- [ ] Keep all existing v2 tests (regression guard for flag-off).
- [ ] Fix the canary URL assertions → `/api/v3/pixels/{id}/conversion_events`.
- [ ] Add v3 payload-shape tests: `data` envelope, `type`/`metadata` renames, epoch-ms
      `event_at`, UPPER_SNAKE tracking types, `action_source` present, `value` double,
      `test_id` when set.
- [ ] Cover `standardEvent` + `customEvent`, `perform` + `performBatch`, flag on/off.

### Phase 6 — Docs, rollout, live validation

- [ ] Delete the stale `breaking-changes-analysis.md` (its "additive/LOW" claim is wrong).
- [ ] Rewrite the PR description: breaking payload migration, not a version bump.
- [ ] **Live re-validate** on the Reddit test account: flag-off → 200 (v2, already verified);
      flag-on → 200 on `/api/v3/pixels/{id}/conversion_events`.
- [ ] Roll out by **percentage** via the flag; never dual-send the same event to v2 and v3.

---

## Product decisions still needed (block Phase 2/3)

1. **`action_source`** (required in v3). _Rec: optional field, default `WEBSITE`._
2. **`test_mode` → `test_id`**. _Rec: add optional `test_id`; leave `test_mode` for v2._
3. **`event_source_url`**. _Rec: add optional now._

## Customer communication

- v3 changes on-the-wire behavior; customers should be informed of the migration and the
  percentage rollout plan.
- Existing bearer tokens remain valid — no re-auth required.
- With the flag approach, **existing mappings keep working** (no manual re-mapping) — comms
  are about _behavior/rollout_, not about reconfiguring the destination.

## Cleanup (when v3 is promoted to default)

1. Delete `v2/` directory.
2. Collapse `send()` → call `sendV3` directly.
3. Remove `FLAGON_NAME`, `getApiVersion`, `CANARY_API_VERSION`, and the version fork.
4. Delete v2 regression tests; promote v3 tests to primary.
5. `test_mode` setting deprecation (customer-visible) — the one non-deletion cleanup step.

## Effort

~2.5–3.5 engineer-days (per `V3-MIGRATION.md` §7), plus the 3 product decisions and a
re-read of the v3 response spec for error handling.
