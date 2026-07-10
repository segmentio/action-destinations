# Reddit Conversions API v3 — Source Reference

Verbatim/near-verbatim capture of Reddit's official docs, pasted manually by the team
(the `ads-api.reddit.com` host is not fetchable from CI). This is the source of truth for the
v3 implementation — see [`V3-MIGRATION.md`](./V3-MIGRATION.md) and
[`V3-ACTION-PLAN.md`](./V3-ACTION-PLAN.md).

Sources:

- v2→v3 migration: https://ads-api.reddit.com/docs/v3/capi-migration
- Direct Integration: https://ads-api.reddit.com/docs/v3/ (Conversions API → Direct Integration)
- Verify Conversion Events (Event Testing): Reddit Ads Help / docs
- v3 changelog: https://ads-api.reddit.com/docs/v3/changelog

---

## 1. Endpoint

```
POST https://ads-api.reddit.com/api/v3/pixels/{{pixel_id}}/conversion_events
```

- Keyed by **Pixel ID** (our `settings.ad_account_id`, labeled "Pixel ID").
- Existing bearer tokens (`conversion_token`) remain valid for v3 — no re-auth.
- Auth header unchanged: `Authorization: Bearer {conversion_token}`.

### Success response

```json
{ "data": { "message": "Successfully processed 1 conversion events." } }
```

### Limits

- Rate limit: 1,000 requests/sec, 10,000 events/sec, **1,000 events/request**.
- Events must be sent within **7 days** after they occur.
- Deduplication requires events sent within **2 days**.

---

## 2. Migration: v2.0 → v3 (what changed)

### Endpoint path

| v2                                           | v3                                               |
| -------------------------------------------- | ------------------------------------------------ |
| `.../api/v2.0/conversions/events/{Pixel ID}` | `.../api/v3/pixels/{Pixel ID}/conversion_events` |

### Request structure — new `data` wrapper

v2:

```json
{
  "events": [
    /* ...event data */
  ]
}
```

v3:

```json
{
  "data": {
    "events": [
      /* ...event data */
    ]
  }
}
```

### Request parameters (unlisted fields unchanged)

| v2                             | v3                                                                |
| ------------------------------ | ----------------------------------------------------------------- |
| `test_mode`                    | deprecated → now supported through `test_id`                      |
| `event_at`                     | changed to **integer, Unix epoch in milliseconds**                |
| `event_at_ms`                  | deprecated → now supported through `event_at`                     |
| `action_source`                | **now a required field**                                          |
| `event_type`                   | renamed to `type`                                                 |
| `event_type.tracking_type`     | updated enum to **UPPER_SNAKE_CASE** (e.g., `PAGE_VISIT`)         |
| `event_metadata`               | renamed to `metadata`                                             |
| `event_metadata.value`         | changed to **double** type, base unit of currency                 |
| `event_metadata.value_decimal` | deprecated → now supported through `value`                        |
| `user.opt_out`                 | deprecated → now supported through `user.data_processing_options` |
| N/A                            | new: `event_source_url` (domain detection / attribution)          |

### Standard event enum mapping

| v2              | v3                |
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

### Step-by-step (per Reddit)

1. Update endpoint path to `/api/v3/pixels/{{Pixel ID}}/conversion_events`.
2. Wrap JSON payload in a `data` node.
3. Update parameters:
   - Remove `test_mode`
   - Convert `event_at` to Unix epoch ms (or rename `event_at_ms` → `event_at`)
   - Label event with a permitted `action_source`
   - Rename `event_type` → `type`, `event_metadata` → `metadata`
   - `tracking_type` → UPPER_SNAKE_CASE
   - `metadata.value` as double (or rename `value_decimal` → `value`)
   - Replace `user.opt_out` with `user.data_processing_options`
   - (Optional, WEBSITE events only) provide `event_source_url`
4. Verify events in Event Testing.

### Things to know

- Reddit accepts events from both CAPI versions. **Do not dual-send the same event to both.**
- Recommend **percentage rollout** when migrating production traffic.
- Existing bearer tokens still valid.

---

## 3. Direct Integration — payload details

### Custom conversion events

Set `tracking_type` to `"CUSTOM"` and assign `custom_event_name` (free-form, case-sensitive,
UTF-8, ≤ 64 chars). `custom_event_name` lives **inside `type`**:

```json
"events": [ {
  "event_at": 1735707600000,
  "action_source": "WEBSITE",
  "type": { "tracking_type": "CUSTOM", "custom_event_name": "Promotion Event" }
} ]
```

Only the 20 most recent custom events are visible on the dashboard.

### Standard event + domain detection

```json
"events": [ {
  "event_at": 1735707600000,
  "event_source_url": "https://www.example.com/checkout?rdt_cid=3184742045291813272",
  "action_source": "WEBSITE",
  "type": { "tracking_type": "PURCHASE" }
} ]
```

`event_source_url` → domain is parsed from the URL. Include click ID in the URL to improve
attribution (used when `click_id` isn't provided separately).

### action_source (required, per event)

Identifies whether the conversion happened online, offline, or another source ("omnichannel
attribution"). Used for source-level metrics (CPA/ROAS breakdown by channel).

```json
"events": [ { "action_source": "WEBSITE", ... } ]
```

**Supported channels** (from the Omnichannel Attribution doc):
| Display label | Description | Wire value |
| --- | --- | --- |
| Website | Conversion on a website | `WEBSITE` (confirmed in payload examples) |
| App | Within an app environment (e.g. mobile game) | `APP` |
| Offline (physical store) | Brick-and-mortar / offline | `PHYSICAL_STORE` (per changelog) — ⚠️ see note |
| Other | Somewhere else | `OTHER` |

> ⚠️ **Wire-value ambiguity for the offline channel.** The changelog lists the enum value as
> `PHYSICAL_STORE`; the Omnichannel page shows only the _label_ "Offline (physical store)".
> Payload examples only ever show `WEBSITE`, so `PHYSICAL_STORE` is inferred, not confirmed.
> **Confirm the exact offline wire value before exposing it as a field choice.** > `WEBSITE`, `APP`, `OTHER` are safe.

Notes:

- Default channel is **Website** (matches our chosen field default `WEBSITE`).
- Reddit Pixel events count as WEBSITE; dedup is per-source (Pixel dedups against CAPI
  `WEBSITE` only).
- Match keys should be appropriate per source: **offline events** should send hashed
  email/phone but **no** device identifiers, click ID, UUID, or MAIDs.
- Only direct + GTM integrations support omnichannel (not file upload / partner).
- Event deduplication applies only for events in the same channel.

### Match keys (per event)

```json
"events": [ {
  "click_id": "12345",
  "user": {
    "ip_address": "192.168.0.1",
    "user_agent": "Chrome/98.0.4758.102",
    "screen_dimensions": { "width": 1920, "height": 1080 },
    "uuid": "1677712978045.b8f7eb7d-b357-437b-8bd3-e1c8166c7132",
    "email": "example@email.com",
    "phone_number": "+15554441234",
    "external_id": "customer12345",
    "idfa": "8A2E4F6D-0852-4B2A-B9D5-79334DE14B16",
    "aaid": "38400000-8cf0-11bd-b23e-10b96e40000d"
  }
} ]
```

Signals can be sent unhashed or pre-hashed. Reddit recommends SHA-256.

### Hashing rules (match our existing v2 implementation)

**Email** — canonicalize before hashing:

- lowercase
- remove dots in local part; remove anything after `+`
- SHA-256 → 64 lowercase hex digits
- e.g. `alice@example.com` and `Al.ice+Apple@Example.Com` →
  `ff8d9819fc0e12bf0d24892e45987e249a28dce836a85cad60e28eaaa8c6d976`

**Phone** — canonicalize:

- include country + area code; remove extension; remove all non-numeric; must start with `+`
- SHA-256 → 64 lowercase hex
- e.g. `+15554441234` → `e5b124c58580eb16bd959b8d0cac12b12c952e2ceae0203d416cff94f10b994a`

**MAIDs** — IDFA uppercase hex, AAID lowercase hex, keep dashes; SHA-256 → 64 lowercase hex.

**External ID** — advertiser-assigned; recommend pairing with click ID.

- unhashed e.g. `customer12345`; hashed e.g. `a4cc2fc5...`

> Note: our v2 `utils.ts` already implements canonicalizeEmail / cleanPhoneNumber / getAdId
> exactly per these rules — hashing is SHARED and reused for v3, not reimplemented.

### Event metadata

```json
"events": [ {
  "metadata": {
    "item_count": 2,
    "currency": "USD",
    "value": 100.00,
    "conversion_id": "unique-id",
    "products": [ {
      "id": "SKU or GTIN",
      "name": "Title of the product",
      "category": "Product group",
      "quantity": 1,
      "item_price": 50.00
    } ]
  }
} ]
```

- `quantity` and `item_price` are NOT replacements for `item_count` and `value` (the latter
  drive optimization; strongly recommended for revenue events).
- `conversion_id` — strongly recommended when using Pixel + CAPI together (dedup). May be
  hashed (SHA-256) or unhashed.

### Opt out (LDU)

```json
"events": [ {
  "user": {
    "data_processing_options": { "modes": [ "LDU" ], "country": "US", "region": "US-CA" }
  }
} ]
```

---

## 4. Deduplication (informational — no code change needed today)

- **Conversion ID (recommended):** unique per distinct event, shared across Pixel + CAPI.
  Preferred whenever provided; lower-quality duplicate is dropped.
- **Session-based (default):** used when no conversion ID; needs UUID or external ID on all
  events. A session = events from one user, ≤ 5 min apart.
- Dedup only across the same event type (custom: name must match too).
- Events must be sent within **2 days** for proper dedup.
- Suggested conversion_id recipe: SHA-256 of `event_at + tracking_type + metadata_value + ip`.

---

## 5. Event Testing / `test_id` (verification)

- `test_id` is a **per-request string** copied from **Event Testing** in Ads Manager.
- Set it as `"test_id"` in the POST request to route events to the Event Testing view.
- **Must be REMOVED from the request before deploying to production.**
- Test events rate limit: **10 events/sec**.
- **Batch events NOT supported in Event Testing** — only one event per request is displayed.
  (Batching still works in production; it just can't be verified through Event Testing.)
- Events may take up to 5 seconds to appear.
- Expand an event in the UI to see: received Pixel ID, Conversion ID, Match keys, Metadata,
  Referrer URL.

### Design implication for our destination

- `test_id` is ephemeral/QA-only → model as an **optional field** (NOT reused from the v2
  `test_mode` boolean setting). A persistent setting would silently route production traffic
  to testing forever.
- v2 `test_mode` setting stays as-is for the v2 path; the two are unrelated mechanisms.
- For live v3 validation: use **single events** (`perform`), not batch, since Event Testing
  won't display batches.

### Other verification methods

- Events Manager: real-time event listing / counts sanity check.
- Get Last Fired At: latest conversion send time (ISO 8601).
- Get A Report: recommended for verifying **custom** events.

---

## 6. Error handling

Errors also surface in **Diagnostics** in Ads Manager; issues may take 24h to clear.

### 400 — Bad Request

| Error message                                                         | Reason                                                                                                            | Solution                                                                                                     |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `There were {Number} invalid conversion events. None were processed.` | Payload doesn't conform to v3 validation (e.g. wrong/missing `type.tracking_type` or `metadata`). No events sent. | Pass valid values. If migrated from v2, review event changes (`event_type.tracking_type`, `event_metadata`). |
| `Bad Request`                                                         | Exceeded max 1,000 events/call.                                                                                   | Split into multiple calls.                                                                                   |

### 401 — Unauthorized

| Error message              | Reason                                 | Solution                     |
| -------------------------- | -------------------------------------- | ---------------------------- |
| `No bearer token provided` | No bearer token in request.            | Pass token properly.         |
| `UNAUTHORIZED`             | Invalid token, can't be authenticated. | Create a valid access token. |

### 403 — Forbidden

| Error message                                                       | Reason                                   | Solution                                        |
| ------------------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------- |
| `You're not authorized to post conversions to Pixel ID {Pixel ID}.` | Account lacks permission for this Pixel. | Use a token with permission + correct Pixel ID. |
| `Missing adsconversions scope to post conversions to Pixel.`        | Developer app missing scope.             | Add `adsconversions` to scope.                  |

### 429 — Too Many Requests

| Error message                                    | Reason                                     | Solution                                                           |
| ------------------------------------------------ | ------------------------------------------ | ------------------------------------------------------------------ |
| `Your user agent was automatically ratelimited.` | Default user agents get throttled.         | Set a unique, descriptive `user-agent` header.                     |
| `Too many requests/events within timeframe.`     | Rate-limit quota exhausted for the window. | Cache/store data; batch backfills; retry with exponential backoff. |

### 500 — Internal Server Error

| Error message                                                                | Reason            | Solution     |
| ---------------------------------------------------------------------------- | ----------------- | ------------ |
| `The service is currently unavailable. No conversion events were processed.` | Service downtime. | Retry later. |

### Mapping to core error classes (Phase 4 implementation)

| HTTP | Core error class                     | Retried? | Notes                                                                                                                                |
| ---- | ------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 400  | `PayloadValidationError`             | No       | Bad payload / >1000 events — retry won't help.                                                                                       |
| 401  | `InvalidAuthenticationError`         | No       | Bad/missing token.                                                                                                                   |
| 403  | `IntegrationError` (auth/permission) | No       | Wrong Pixel permission or missing `adsconversions` scope.                                                                            |
| 429  | `RetryableError`                     | Yes      | Rate limited — backoff. Also: we already set a descriptive `user-agent` (`Segment (Actions)`), which avoids the default-UA throttle. |
| 500  | `RetryableError`                     | Yes      | Transient downtime.                                                                                                                  |

> Our request client sends `user-agent: Segment (Actions)` (seen in the v2 live test), so the
> "default user agent ratelimited" 429 shouldn't apply to us — but 429 handling still covers
> the quota case.

---

## Open confirmations

- Exact **offline** `action_source` wire value (`PHYSICAL_STORE` inferred from changelog vs.
  the "Offline (physical store)" label). `WEBSITE`/`APP`/`OTHER` confirmed. See §3.
