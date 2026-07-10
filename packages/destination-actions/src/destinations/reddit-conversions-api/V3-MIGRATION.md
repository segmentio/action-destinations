# Reddit Conversions API — v2.0 → v3 Migration Analysis

Source: https://ads-api.reddit.com/docs/v3/capi-migration (provided manually — host is
not fetchable from CI). Also cross-referenced with the v3 changelog and the
`reddit-audiences` destination (which already uses `v3`).

## TL;DR

The initial ticket framed this as a **version-string bump** behind a feature flag. That
framing was wrong. Reddit's Conversions API v3 is a **breaking payload rewrite**: a new
endpoint path, a new request envelope, renamed/retyped/removed fields, and a newly
**required** field (`action_source`). It cannot be done by swapping the version segment in
the URL.

The feature-flag scaffolding already built (versioning-info, `getApiVersion`, flag threading,
tests) is still the right foundation — but the `send()` path needs a full v3 payload builder
gated behind the flag.

---

## 1. Endpoint path

|                    | Path                                                                         |
| ------------------ | ---------------------------------------------------------------------------- |
| **v2.0 (current)** | `POST https://ads-api.reddit.com/api/v2.0/conversions/events/{Pixel ID}`     |
| **v3 (target)**    | `POST https://ads-api.reddit.com/api/v3/pixels/{Pixel ID}/conversion_events` |

- Still keyed by **Pixel ID** (our `settings.ad_account_id`, labeled "Pixel ID"). **No new
  account identifier is required** for the URL — good, this avoids a settings migration.
- Resource renamed: `conversions/events` → `pixels/{id}/conversion_events`.
- Auth unchanged: existing bearer token (`conversion_token`) remains valid for v3.

> This is why our two earlier guesses 404'd:
> `/api/v3/conversions/events/{id}` and `/api/v3/ad_accounts/{id}/conversions/events`
> are both wrong. The correct resource is `pixels/{id}/conversion_events`.

---

## 2. Request envelope

**v2.0 (current)** — top-level `events`:

```json
{
  "events": [
    /* ...event items... */
  ],
  "test_mode": false,
  "partner": "SEGMENT"
}
```

**v3 (target)** — everything wrapped in a `data` node:

```json
{
  "data": {
    "events": [
      /* ...event items... */
    ],
    "partner": "SEGMENT"
  }
}
```

- New nested `data` wrapper around the original payload.
- `test_mode` no longer lives here (see §3).

---

## 3. Field-level changes (per event item)

"Unlisted fields remain unchanged." Everything below changes.

| Concern          | v2.0 (what we send today)              | v3 (what we must send)                                     | Type of change                |
| ---------------- | -------------------------------------- | ---------------------------------------------------------- | ----------------------------- |
| Envelope         | `{ events: [...] }`                    | `{ data: { events: [...] } }`                              | **Structure**                 |
| Test flag        | `test_mode: boolean` (top level)       | `test_id: string` (from Event Testing tool)                | **Deprecated → replaced**     |
| Timestamp        | `event_at: string` (RFC3339/ISO)       | `event_at: integer` (Unix epoch **ms**)                    | **Type change**               |
| Timestamp (alt)  | —                                      | `event_at_ms` deprecated → use `event_at`                  | Info                          |
| Action source    | _(not sent)_                           | `action_source: string` — **REQUIRED**                     | **New required**              |
| Event wrapper    | `event_type: {...}`                    | `type: {...}`                                              | **Renamed**                   |
| Tracking type    | `tracking_type: "PageVisit"`           | `type.tracking_type: "PAGE_VISIT"`                         | **Enum format (UPPER_SNAKE)** |
| Metadata wrapper | `event_metadata: {...}`                | `metadata: {...}`                                          | **Renamed**                   |
| Value            | `event_metadata.value_decimal: number` | `metadata.value: double`                                   | **Renamed + type**            |
| Opt-out          | `user.opt_out`                         | `user.data_processing_options`                             | **Deprecated → replaced**     |
| Source URL       | —                                      | `event_source_url: string` (WEBSITE events only, optional) | **New optional**              |

Notes:

- We do **not** currently send `user.opt_out`, so that row is a no-op for us (we already use
  `data_processing_options`).
- We do **not** currently send `event_at_ms`.

### Standard event enum mapping (v2 → v3)

| v2.0            | v3                |
| --------------- | ----------------- |
| `PageVisit`     | `PAGE_VISIT`      |
| `ViewContent`   | `VIEW_CONTENT`    |
| `Search`        | `SEARCH`          |
| `AddToCart`     | `ADD_TO_CART`     |
| `AddToWishlist` | `ADD_TO_WISHLIST` |
| `Purchase`      | `PURCHASE`        |
| `Lead`          | `LEAD`            |
| `SignUp`        | `SIGN_UP`         |
| `Custom`        | `CUSTOM`          |

The `customEvent` action sends `tracking_type: 'Custom'` → must become `CUSTOM` in v3.

---

## 4. What we have TODAY (current implementation)

Files: `packages/destination-actions/src/destinations/reddit-conversions-api/`

- **`versioning-info.ts`** — `REDDIT_CONVERSIONS_API_VERSION = 'v2.0'`,
  `REDDIT_CONVERSIONS_CANARY_API_VERSION = 'v3'`.
- **`utils.ts`**
  - `getApiVersion(features)` — returns canary version when flag on. ✅ correct, reusable.
  - `getConversionsUrl(version, adAccountId)` — currently builds the WRONG v3 path
    (`ad_accounts/{id}/conversions/events`). **Must fix to `pixels/{id}/conversion_events`.**
  - `send()` — builds one payload shape (`createRedditPayload`) for both versions. **Must
    branch on version.**
  - `createRedditPayload()` — produces the v2 envelope (`{ events, test_mode, partner }`) and
    v2 item shape (`event_type`, `event_metadata`, ISO `event_at`, mixed-case `tracking_type`).
- **`types.ts`** — `StandardEventPayload` / `StandardEventPayloadItem` model the **v2** shape
  only. Need v3 counterparts.
- **`fields.ts`** — `tracking_type` choices use v2 casing (`PageVisit`…); `event_at` default
  maps `$.timestamp` (ISO string); `event_metadata.value_decimal`. No `action_source`, no
  `test_id`, no `event_source_url`.
- **`index.ts`** — `test_mode` boolean setting; `testAuthentication` posts a v2 payload to the
  v2 path (pinned to stable — OK to leave).
- **Tests** — cover v2 shape + flag-based URL selection (currently asserting the wrong v3
  path).

Live-test status: **v2.0 path verified working (200 in test mode).** v3 not yet working.

---

## 5. What we MUST DO for v3 compatibility

Gated entirely behind the existing `reddit-conversions-api-canary-version` flag so v2.0 is
untouched.

### 5.1 URL (small)

- Fix `getConversionsUrl` v3 branch → `…/api/v3/pixels/{pixelId}/conversion_events`.

### 5.2 New v3 payload builder (core of the work)

- Add `createRedditPayloadV3()` (or parameterize the existing builder by version) that emits:
  - `{ data: { events: [...], partner: 'SEGMENT' } }` envelope.
  - Per item: `type` (was `event_type`), `metadata` (was `event_metadata`),
    `event_at` as **epoch ms integer**, `metadata.value` (was `value_decimal`) as double.
  - `tracking_type` mapped to **UPPER_SNAKE** via a v2→v3 enum map (incl. `Custom`→`CUSTOM`).
  - `action_source` on every event (**required** — see decisions below).
  - Optional `event_source_url` when present (WEBSITE events).
  - `test_id` instead of `test_mode` (see decisions).
- `send()` branches: v2 → existing builder + v2 URL; v3 → new builder + v3 URL.

### 5.3 New / changed fields (`fields.ts`)

- **`action_source`** — new input field (required in v3). See Decision 1.
- **`test_id`** — new optional input field. See Decision 2.
- **`event_source_url`** — new optional input field (maps e.g. `$.context.page.url`).
- `tracking_type` — keep v2 choices in the field (customer-facing labels); do the UPPER_SNAKE
  conversion internally so we don't break existing v2 mappings.
- `event_at` — keep the ISO `$.timestamp` default; convert to epoch ms inside the v3 builder.

### 5.4 Types (`types.ts`)

- Add v3 interfaces: `RedditV3Payload { data: { events: RedditV3Event[], partner } }`,
  `RedditV3Event` with `type`, `metadata`, integer `event_at`, `action_source`, etc.

### 5.5 Tests

- Fix canary URL assertions → `pixels/{id}/conversion_events`.
- Add v3 payload-shape assertions: envelope wrapping, `type`/`metadata` rename, epoch-ms
  `event_at`, UPPER_SNAKE tracking types, `action_source`, `value` as double.
- Keep all v2 tests asserting the unchanged v2 shape (regression guard).
- Cover both `standardEvent` and `customEvent`, `perform` + `performBatch`.

### 5.6 Error handling

- v3 returns "a wide range of HTTP status codes" with a documented response format. Review
  `Post Conversion Events` response docs and map to the destination's error classes
  (`RetryableError`, `PayloadValidationError`, etc.). Current code only special-cases 401/403
  in `testAuthentication`.

### 5.7 Docs / rollout

- Replace `breaking-changes-analysis.md` (now inaccurate — it claimed "additive, LOW risk").
- Update PR description: this is a breaking payload migration, not a version bump.
- Reddit explicitly recommends **percentage rollout** and warns against **dual-sending** the
  same event to v2 and v3 — the flag gives us the percentage rollout lever.

---

## 6. Open product decisions (block a clean implementation)

1. **`action_source` (now required in v3)** — not in the destination today. Options:
   (a) new optional field defaulting to `WEBSITE`; (b) hardcode `WEBSITE` for v3;
   (c) new required field (breaking for existing mappings — discouraged).
   _Recommendation: (a)._
2. **`test_mode` → `test_id`** — v3 drops the boolean for a string test id from Reddit's Event
   Testing tool. Options: (a) add optional `test_id` field; (b) derive/skip; (c) ignore for v3.
   _Recommendation: (a)._
3. **`event_source_url`** — add as optional now, or defer? _Recommendation: add now_ (cheap,
   improves attribution, WEBSITE-only).

---

## 7. Scope assessment — "how much did this explode?"

**Original ticket estimate:** version bump behind a flag ≈ a few hours (URL constant + flag +
tests). Effectively what we'd already built.

**Actual v3 scope:** a breaking API migration. Rough breakdown:

| Work                                                                   | Est.      | Risk                              |
| ---------------------------------------------------------------------- | --------- | --------------------------------- |
| Fix v3 URL path                                                        | ~15 min   | Low                               |
| v3 payload builder (envelope, renames, epoch-ms, enum map, value type) | 0.5–1 day | **Med** — most logic + edge cases |
| New fields (`action_source`, `test_id`, `event_source_url`) + type gen | 0.5 day   | Med — product decisions above     |
| v3 types                                                               | ~1 hr     | Low                               |
| Tests (v3 shape + regression)                                          | 0.5 day   | Med                               |
| v3 error-code handling                                                 | 0.5 day   | Med — needs response-format docs  |
| Docs, PR rewrite, live re-validation on test account                   | 0.5 day   | Low                               |

**Total: roughly 2.5–3.5 engineer-days**, up from a ~half-day task. Plus the dependency on
the two product decisions and a re-read of the v3 `Post Conversion Events` response spec for
error handling.

**Recommendation:** treat v3 as its own tracked story (not a "version upgrade" subtask). The
existing branch's flag scaffolding is a good base; the payload rewrite is net-new work. Keep
v2.0 as the default (flag off) until v3 is fully built, live-verified on the test account, and
rolled out by percentage.

---

## 8. Suggested checklist (once decisions are made)

- [ ] Fix `getConversionsUrl` v3 → `pixels/{id}/conversion_events`
- [ ] Add `createRedditPayloadV3()` + version branch in `send()`
- [ ] v2→v3 `tracking_type` enum map (incl. `Custom`→`CUSTOM`)
- [ ] `event_at` → epoch-ms integer (v3 only)
- [ ] `event_metadata`→`metadata`, `value_decimal`→`value` (double)
- [ ] `event_type`→`type`
- [ ] Add `action_source` (per Decision 1)
- [ ] Add `test_id`; stop sending `test_mode` on v3 (per Decision 2)
- [ ] Add optional `event_source_url`
- [ ] v3 types in `types.ts`
- [ ] Update tests (v3 shape + keep v2 regression)
- [ ] v3 error-code handling
- [ ] Rewrite `breaking-changes-analysis.md` / PR description
- [ ] Live re-validate both paths on the Reddit test account
