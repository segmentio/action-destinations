# Breaking Changes Analysis: v2.0 → v3

Source: https://ads-api.reddit.com/docs/v3/changelog (reviewed manually)

## Summary

Upgrade of the Reddit Conversions API from **v2.0** (stable/production) to **v3**
(canary/feature-flagged), behind the feature flag `reddit-conversions-api-canary-version`.

The version is the only path segment that changes in the request URL:

```
https://ads-api.reddit.com/api/<version>/conversions/events/<ad_account_id>
```

> **⚠️ Path segment is `v3`, NOT `v3.0`.** Per the changelog (Feb 6, 2024 — General
> Changes): _"Updated path from `/api/v2.0/` to `/api/v3/`."_ The canary constant is
> therefore `'v3'` so the URL resolves to `/api/v3/conversions/events/...`.

For the **Conversions API endpoint specifically**, every change between v2.0 and v3 is
**additive or operational** — there are no changes that break the request body, response,
auth, or error handling this destination relies on.

## Critical Breaking Changes (affecting this destination)

**1. URL path version segment changed: `/api/v2.0/` → `/api/v3/`** — Risk: HIGH

- **Impact**: The base path moves. This is the entire substance of the upgrade.
- **Required action**: Use `v3` (not `v3.0`) as the path segment. ✅ Done in `versioning-info.ts`.
- **Mitigation**: Behind feature flag; stable v2.0 path untouched.

No other breaking changes affect the conversion events endpoint.

## Conversions API changes v2.0 → v3 (all additive — no action required)

| Date       | Change                                                                                     | Type     |
| ---------- | ------------------------------------------------------------------------------------------ | -------- |
| 2026-03-16 | Added `item_price` and `quantity` fields for products in conversion events                 | Additive |
| 2026-03-11 | Added `PHYSICAL_STORE`, `APP`, `OTHER` as valid action sources; added `conversion_metrics` | Additive |
| 2026-03-09 | Added `event_source_url` field for domain and click ID extraction                          | Additive |
| 2025-10-01 | Released Post Conversion Events (encouraged migration; new capability)                     | Additive |

None of these remove or rename a field this destination sends today (`event_at`,
`event_type`, `click_id`, `event_metadata`, `user`, `products`, etc.), so the existing
payload remains valid against v3.

## Operational / Behavioral Changes (platform-wide, not endpoint-breaking)

- **Rate limiting** (2024-02-06 multi-level limits, user limit raised to 5 req/s;
  2025-07-21 group-based limits + `RateLimit` / `RateLimit-Policy` response headers).
  - **Impact**: None on payload shape. Segment's request layer already handles 429s with
    retry. No code change needed.
- **Removed account-level allow-listing requirement** (2024-02-06) — strictly a relaxation.

## Explicitly NOT a breaking change for event sending

- **2025-05-05** — _"Removed SEARCH, VIEW_CONTENT, and ADD_TO_WISHLIST support for
  `optimization_goal` in new ad groups."_ This constrains **ad group `optimization_goal`**
  configuration, **not** the conversion event `tracking_type`. This destination sends
  `tracking_type` values (incl. `ViewContent`, `Search`, `AddToWishlist` via presets) on
  conversion **events**, which is a different field on a different API. Sending those event
  types remains valid. No change required.

## Checklist Verification (against v3 changelog)

### Request Changes

- [x] New required parameters — **none** for conversions/events
- [x] Removed or deprecated parameters — **none** for conversions/events
- [x] Changed parameter types or formats — **none**
- [x] Modified validation rules — **none** for conversions/events
- [x] Different authentication methods — **no change** (`Authorization: Bearer <conversion_token>`)
- [x] New headers required — **none** (new `RateLimit-*` headers are response-only)
- [x] Changed request body structure — **additive only** (`item_price`, `quantity`, `event_source_url`)

### Response Changes

- [x] Modified response schema — none affecting this destination
- [x] Removed response fields — none
- [x] Changed field types — none
- [x] Different error codes — none (401 → invalid token, 403 → invalid ad account still apply)
- [x] New error response formats — none

### Behavioral Changes

- [x] Rate limiting differences — yes (multi-level, 5 req/s, RateLimit headers); handled by request retry layer
- [x] Batching size limits — no documented change
- [x] Timeout changes — none
- [x] Retry logic requirements — none beyond existing 429 handling
- [x] Idempotency key handling — none

### Endpoint Changes

- [x] URL pattern changes — **YES: `/api/v2.0/` → `/api/v3/`** (handled)
- [x] Method changes — none (still POST)
- [x] Deprecated endpoints — conversions/events not deprecated
- [x] New endpoints replacing old ones — none for conversions/events

## Risk Assessment

**Risk Level**: LOW

**Mitigation**:

- Feature flag `reddit-conversions-api-canary-version` allows instant rollback.
- Stable v2.0 path is unchanged; canary only activates when the flag is set.
- All Conversions API changes from v2.0 → v3 are additive; existing payloads stay valid.
- Unit tests cover both stable (flag off → `v2.0`) and canary (flag on → `v3`) request URLs.

## Testing Requirements

- Verify stable `v2.0` endpoint is called by default (no `features`). ✅
- Verify `v3` endpoint is called when `reddit-conversions-api-canary-version` is enabled. ✅
- Cover both `standardEvent` and `customEvent` actions. ✅
- Recommended: live smoke test against a Reddit test account with the flag on before promotion.
