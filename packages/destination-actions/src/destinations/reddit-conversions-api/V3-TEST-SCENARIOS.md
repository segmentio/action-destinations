# Reddit Conversions API v3 — Local Test Scenarios (Bruno)

Manual test guide for the v3 migration behind the `reddit-conversions-api-canary-version` flag.
Run against the local serve harness; each scenario is a copy-paste curl for Bruno.

## Setup

```bash
./bin/run serve actions-reddit-conversions-api
```

- Endpoints: `POST http://localhost:3000/standardEvent`, `POST http://localhost:3000/customEvent`
- Body keys the harness reads: `settings`, `mapping`, `features`, `payload`
- `mapping` values win over field defaults, so literal values give full control
- `features."reddit-conversions-api-canary-version": true` → v3; omit / `false` → v2
- Array `payload` → `performBatch`; object `payload` → `perform`
- The response echoes the **outbound request** (URL + body) our code sent to Reddit plus Reddit's reply — that's what you verify against the "Expect" column

Fill in your own `ad_account_id` (Pixel ID) and `conversion_token`.

**Setup verified:** `PageVisit` v3 → 200 "Successfully processed 1 conversion events." ✅

---

## Scenario matrix

| #   | Scenario            | Action          | Flag (v3?) | What it exercises                                                       | Expect                                                                                                                                      |
| --- | ------------------- | --------------- | ---------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Standard PageVisit  | `standardEvent` | ✅ on      | Baseline v3 envelope + renames + hashing                                | 200; `v3/pixels/.../conversion_events`, `data` wrapper, epoch-ms `event_at`, `type.tracking_type: PAGE_VISIT`, `metadata.value`, PII hashed |
| 2   | Purchase + products | `standardEvent` | ✅ on      | `value` as double, new `products[].quantity`/`item_price`, `item_count` | 200; `tracking_type: PURCHASE`, products carry `quantity` + `item_price`                                                                    |
| 3   | Custom event        | `customEvent`   | ✅ on      | `custom_event_name` inside `type`, forced `CUSTOM`                      | 200; `type.tracking_type: CUSTOM`, `type.custom_event_name: "Promotion Event"`                                                              |
| 4   | test_id routing     | `standardEvent` | ✅ on      | QA routing via per-event `test_id` on envelope                          | 200; `data.test_id` present, routed to Event Testing                                                                                        |
| 5   | Batch               | `standardEvent` | ✅ on      | `performBatch`, multiple events in one `data.events[]`                  | 200; both events in a single `data.events` array                                                                                            |
| 6   | Bad timestamp       | `standardEvent` | ✅ on      | `toEpochMs` strict validation                                           | `PayloadValidationError` (no request sent) — expected reject                                                                                |
| 7   | v2 regression       | `standardEvent` | ❌ off     | v2 path untouched by v3 work                                            | 200; `v2.0/conversions/events/{id}`, flat envelope, `test_mode`, ISO `event_at`, `event_type`/`event_metadata`/`value_decimal`              |

### Error scenarios

Two kinds: **client-side** (our validation rejects before any request leaves) and **server-side**
(Reddit responds with an error — these test how our code surfaces it and whether retry
classification is right). The server-side ones matter for the rollout decision: v3 error-code
mapping is still an open item (v3 send relies on default HTTP error handling), so eyeball whether
Reddit's error body comes back legible.

| #   | Scenario                  | Action          | Flag (v3?) | What it exercises                         | Expect                                                                               |
| --- | ------------------------- | --------------- | ---------- | ----------------------------------------- | ------------------------------------------------------------------------------------ |
| E1  | Unsupported tracking_type | `standardEvent` | ✅ on      | `toV3TrackingType` reject                 | `PayloadValidationError: Unsupported tracking_type`, no request sent                 |
| E2  | Missing tracking_type     | `standardEvent` | ✅ on      | required-field validation                 | Field validation error, no request sent                                              |
| E3  | Missing action_source     | `standardEvent` | ✅ on      | required-with-default field behavior      | Field validation error, no request sent — evidence for email decision #1             |
| E4  | Invalid token             | `standardEvent` | ✅ on      | 401 surfacing / retry classification      | 401 from Reddit; check message legibility (currently generic HTTPError, not retried) |
| E5  | Invalid pixel             | `standardEvent` | ✅ on      | 403/404 surfacing                         | 403 or 404 from Reddit; check message legibility                                     |
| E6  | Payload Reddit rejects    | `standardEvent` | ✅ on      | 400 body surfacing (v3 error mapping gap) | 400 with Reddit error body; **is the message readable, or an opaque blob?**          |

### Coverage scenarios (full vs. bare-minimum payloads)

Prove both extremes of the field surface for each action. Full exercises every transformation path
(`getAdId`, phone hashing, `data_processing_options`, screen dims, multi-product); bare-minimum
proves `undefined` blocks (`user`/`metadata`) are cleanly omitted, not sent as empty objects.

| #   | Scenario              | Action          | Flag (v3?) | What it exercises                                                                      | Expect                                                                     |
| --- | --------------------- | --------------- | ---------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| F1  | Kitchen-sink standard | `standardEvent` | ✅ on      | Every field: advertising_id/device_type, phone, DPO, screen dims, click_id, 2 products | 200; all paths present + correctly hashed in v3 shape                      |
| F2  | Kitchen-sink custom   | `customEvent`   | ✅ on      | Same full surface via custom event                                                     | 200; `type.tracking_type: CUSTOM` + `custom_event_name`, all paths present |
| F3  | Bare-minimum standard | `standardEvent` | ✅ on      | Only `event_at`, `action_source`, `tracking_type` — no user/metadata                   | 200; `user` and `metadata` omitted (not empty objects)                     |
| F4  | Bare-minimum custom   | `customEvent`   | ✅ on      | Only `event_at`, `action_source`, `custom_event_name` — no user/metadata               | 200; `user`/`metadata` omitted, `type.tracking_type: CUSTOM`               |

---

## 1. Standard PageVisit (v3 baseline) — VERIFIED

```bash
curl --request POST \
  --url http://localhost:3000/standardEvent \
  --header 'content-type: application/json' \
  --data '{
  "settings": { "ad_account_id": "YOUR_PIXEL_ID", "conversion_token": "YOUR_CONVERSION_TOKEN" },
  "features": { "reddit-conversions-api-canary-version": true },
  "mapping": {
    "tracking_type": "PageVisit",
    "action_source": "WEBSITE",
    "event_at": "2026-07-07T12:00:00.000Z",
    "event_source_url": "https://example.com/p/123",
    "conversion_id": "test-conv-001",
    "event_metadata": { "currency": "USD", "value_decimal": 9.99, "item_count": 1 },
    "user": { "email": "test@example.com", "external_id": "identity-test", "ip_address": "127.0.0.1", "user_agent": "Mozilla/5.0" }
  },
  "payload": { "type": "page", "userId": "user-001", "timestamp": "2026-07-07T12:00:00.000Z" }
}'
```

## 2. Purchase + products (v3) - VERIFIED

```bash
curl --request POST \
  --url http://localhost:3000/standardEvent \
  --header 'content-type: application/json' \
  --data '{
  "settings": { "ad_account_id": "YOUR_PIXEL_ID", "conversion_token": "YOUR_CONVERSION_TOKEN" },
  "features": { "reddit-conversions-api-canary-version": true },
  "mapping": {
    "tracking_type": "Purchase",
    "action_source": "WEBSITE",
    "event_at": "2026-07-07T12:00:00.000Z",
    "conversion_id": "order-9001",
    "event_metadata": { "currency": "USD", "value_decimal": 59.98, "item_count": 2 },
    "products": [ { "category": "shoes", "id": "SKU-1", "name": "Runner", "quantity": 2, "item_price": 29.99 } ],
    "user": { "external_id": "identity-test", "ip_address": "127.0.0.1", "user_agent": "Mozilla/5.0" }
  },
  "payload": { "type": "track", "event": "Order Completed", "userId": "user-001", "timestamp": "2026-07-07T12:00:00.000Z" }
}'
```

## 3. Custom event (v3) - VERIFIED

```bash
curl --request POST \
  --url http://localhost:3000/customEvent \
  --header 'content-type: application/json' \
  --data '{
  "settings": { "ad_account_id": "YOUR_PIXEL_ID", "conversion_token": "YOUR_CONVERSION_TOKEN" },
  "features": { "reddit-conversions-api-canary-version": true },
  "mapping": {
    "custom_event_name": "Promotion Event",
    "action_source": "WEBSITE",
    "event_at": "2026-07-07T12:00:00.000Z",
    "user": { "external_id": "identity-test", "ip_address": "127.0.0.1", "user_agent": "Mozilla/5.0" }
  },
  "payload": { "type": "track", "event": "Promotion Event", "userId": "user-001", "timestamp": "2026-07-07T12:00:00.000Z" }
}'
```

## 4. test_id routing (v3 QA) - VERIFIED

```bash
curl --request POST \
  --url http://localhost:3000/standardEvent \
  --header 'content-type: application/json' \
  --data '{
  "settings": { "ad_account_id": "YOUR_PIXEL_ID", "conversion_token": "YOUR_CONVERSION_TOKEN" },
  "features": { "reddit-conversions-api-canary-version": true },
  "mapping": {
    "tracking_type": "PageVisit",
    "action_source": "WEBSITE",
    "event_at": "2026-07-07T12:00:00.000Z",
    "test_id": "YOUR_EVENT_TESTING_ID",
    "user": { "external_id": "identity-test", "ip_address": "127.0.0.1", "user_agent": "Mozilla/5.0" }
  },
  "payload": { "type": "page", "userId": "user-001", "timestamp": "2026-07-07T12:00:00.000Z" }
}'
```

## 5. Batch (v3, performBatch) - returns empty array

`payload` as an array triggers batch. Batch resolves per-item from `payload`, so put resolved event objects there.

```bash
curl --request POST \
  --url http://localhost:3000/standardEvent \
  --header 'content-type: application/json' \
  --data '{
  "settings": { "ad_account_id": "YOUR_PIXEL_ID", "conversion_token": "YOUR_CONVERSION_TOKEN" },
  "features": { "reddit-conversions-api-canary-version": true },
  "payload": [
    { "tracking_type": "PageVisit", "action_source": "WEBSITE", "event_at": "2026-07-07T12:00:00.000Z", "user": { "external_id": "u1" } },
    { "tracking_type": "Purchase", "action_source": "WEBSITE", "event_at": "2026-07-07T12:05:00.000Z", "event_metadata": { "currency": "USD", "value_decimal": 10 }, "user": { "external_id": "u2" } }
  ]
}'
```

## 6. Bad timestamp (v3 validation)

Expect a `PayloadValidationError` and no outbound request — this proves strict epoch-ms conversion.

```bash
curl --request POST \
  --url http://localhost:3000/standardEvent \
  --header 'content-type: application/json' \
  --data '{
  "settings": { "ad_account_id": "YOUR_PIXEL_ID", "conversion_token": "YOUR_CONVERSION_TOKEN" },
  "features": { "reddit-conversions-api-canary-version": true },
  "mapping": {
    "tracking_type": "PageVisit",
    "action_source": "WEBSITE",
    "event_at": "not-a-timestamp",
    "user": { "external_id": "identity-test" }
  },
  "payload": { "type": "page", "userId": "user-001", "timestamp": "2026-07-07T12:00:00.000Z" }
}'
```

## 7. v2 regression (flag OFF)

Same event, no `features`. `test_mode` is a **setting** in v2 (not a mapping field). Confirm the whole shape reverts.

```bash
curl --request POST \
  --url http://localhost:3000/standardEvent \
  --header 'content-type: application/json' \
  --data '{
  "settings": { "ad_account_id": "YOUR_PIXEL_ID", "conversion_token": "YOUR_CONVERSION_TOKEN", "test_mode": true },
  "mapping": {
    "tracking_type": "PageVisit",
    "event_at": "2026-07-07T12:00:00.000Z",
    "event_metadata": { "currency": "USD", "value_decimal": 9.99 },
    "user": { "external_id": "identity-test", "ip_address": "127.0.0.1", "user_agent": "Mozilla/5.0" }
  },
  "payload": { "type": "page", "userId": "user-001", "timestamp": "2026-07-07T12:00:00.000Z" }
}'
```

---

# Error scenarios

## E1. Unsupported tracking_type (client-side reject) - Validated

`toV3TrackingType` throws before any request. Expect `PayloadValidationError: Unsupported tracking_type: Bogus`.

```bash
curl --request POST \
  --url http://localhost:3000/standardEvent \
  --header 'content-type: application/json' \
  --data '{
  "settings": { "ad_account_id": "YOUR_PIXEL_ID", "conversion_token": "YOUR_CONVERSION_TOKEN" },
  "features": { "reddit-conversions-api-canary-version": true },
  "mapping": {
    "tracking_type": "Bogus",
    "action_source": "WEBSITE",
    "event_at": "2026-07-07T12:00:00.000Z",
    "user": { "external_id": "identity-test" }
  },
  "payload": { "type": "page", "userId": "user-001", "timestamp": "2026-07-07T12:00:00.000Z" }
}'
```

## E2. Missing tracking_type (required-field reject)

Omit `tracking_type` on a standard event. Expect a field validation error, no request sent.

```bash
curl --request POST \
  --url http://localhost:3000/standardEvent \
  --header 'content-type: application/json' \
  --data '{
  "settings": { "ad_account_id": "YOUR_PIXEL_ID", "conversion_token": "YOUR_CONVERSION_TOKEN" },
  "features": { "reddit-conversions-api-canary-version": true },
  "mapping": {
    "action_source": "WEBSITE",
    "event_at": "2026-07-07T12:00:00.000Z",
    "user": { "external_id": "identity-test" }
  },
  "payload": { "type": "page", "userId": "user-001", "timestamp": "2026-07-07T12:00:00.000Z" }
}'
```

## E3. Missing action_source (required-with-default reject)

Omit `action_source`. Confirms it is a hard required field — evidence for email decision #1.
(In production the field's `WEBSITE` default fills this in; here the explicit mapping omits it to exercise the required check.)

```bash
curl --request POST \
  --url http://localhost:3000/standardEvent \
  --header 'content-type: application/json' \
  --data '{
  "settings": { "ad_account_id": "YOUR_PIXEL_ID", "conversion_token": "YOUR_CONVERSION_TOKEN" },
  "features": { "reddit-conversions-api-canary-version": true },
  "mapping": {
    "tracking_type": "PageVisit",
    "event_at": "2026-07-07T12:00:00.000Z",
    "user": { "external_id": "identity-test" }
  },
  "payload": { "type": "page", "userId": "user-001", "timestamp": "2026-07-07T12:00:00.000Z" }
}'
```

## E4. Invalid token (Reddit 401)

Real request; Reddit rejects auth. Check how the error surfaces (currently a generic HTTPError, not retried).

```bash
curl --request POST \
  --url http://localhost:3000/standardEvent \
  --header 'content-type: application/json' \
  --data '{
  "settings": { "ad_account_id": "YOUR_PIXEL_ID", "conversion_token": "invalid_token" },
  "features": { "reddit-conversions-api-canary-version": true },
  "mapping": {
    "tracking_type": "PageVisit",
    "action_source": "WEBSITE",
    "event_at": "2026-07-07T12:00:00.000Z",
    "user": { "external_id": "identity-test" }
  },
  "payload": { "type": "page", "userId": "user-001", "timestamp": "2026-07-07T12:00:00.000Z" }
}'
```

## E5. Invalid pixel (Reddit 403/404)

Real request with a bad Pixel ID. Check status + message legibility.

```bash
curl --request POST \
  --url http://localhost:3000/standardEvent \
  --header 'content-type: application/json' \
  --data '{
  "settings": { "ad_account_id": "does_not_exist", "conversion_token": "YOUR_CONVERSION_TOKEN" },
  "features": { "reddit-conversions-api-canary-version": true },
  "mapping": {
    "tracking_type": "PageVisit",
    "action_source": "WEBSITE",
    "event_at": "2026-07-07T12:00:00.000Z",
    "user": { "external_id": "identity-test" }
  },
  "payload": { "type": "page", "userId": "user-001", "timestamp": "2026-07-07T12:00:00.000Z" }
}'
```

## E6. Payload Reddit rejects (Reddit 400)

Real request with a value Reddit should reject (bad currency code). **Key check: is the error body readable, or an opaque blob?** If opaque, we need v3 error-code mapping before promoting the flag.

```bash
curl --request POST \
  --url http://localhost:3000/standardEvent \
  --header 'content-type: application/json' \
  --data '{
  "settings": { "ad_account_id": "YOUR_PIXEL_ID", "conversion_token": "YOUR_CONVERSION_TOKEN" },
  "features": { "reddit-conversions-api-canary-version": true },
  "mapping": {
    "tracking_type": "Purchase",
    "action_source": "WEBSITE",
    "event_at": "2026-07-07T12:00:00.000Z",
    "event_metadata": { "currency": "NOTACURRENCY", "value_decimal": 9.99 },
    "user": { "external_id": "identity-test" }
  },
  "payload": { "type": "track", "event": "Order Completed", "userId": "user-001", "timestamp": "2026-07-07T12:00:00.000Z" }
}'
```

> Note: `currency` has an enum in `fields.ts`, so `NOTACURRENCY` is rejected by our AJV validation
> before reaching Reddit (500 in serve = 400 in prod, field `event_metadata.currency`). To force a
> real Reddit 400, use a field that passes our schema but fails Reddit's — e.g. a non-RFC-4122
> `user.uuid` like `"1700000000.abcd-uuid"`.
>
> **Confirmed real Reddit v3 400 (via bad uuid):** the error body is fully legible and field-scoped,
> and our default HTTPError handling surfaces it intact (not retried, correct for a 400):
>
> ```json
> {
>   "error": {
>     "code": 400,
>     "message": "There were 1 invalid conversion events. None were processed.",
>     "fields": [
>       {
>         "field": "$.data.events[0].user.UUID",
>         "message": "user.UUID: ... invalid UUID: UUID must be RFC-4122 compliant"
>       }
>     ]
>   }
> }
> ```
>
> → v3 error bodies are readable; no custom v3 error-code mapping strictly required for rollout.

---

# Coverage scenarios (full vs. bare-minimum)

## F1. Kitchen-sink standard event (v3)

Every field populated. `action_source: APP` to exercise the mobile-id path. Verify in the outbound
body: `user` has hashed `advertising_id`/`email`/`external_id`/`ip_address`/`phone_number`,
`data_processing_options` with `modes: ["LDU"]`, `screen_dimensions`, `click_id`, and both products
carry `quantity`/`item_price`.

```bash
curl --request POST \
  --url http://localhost:3000/standardEvent \
  --header 'content-type: application/json' \
  --data '{
  "settings": { "ad_account_id": "YOUR_PIXEL_ID", "conversion_token": "YOUR_CONVERSION_TOKEN" },
  "features": { "reddit-conversions-api-canary-version": true },
  "mapping": {
    "tracking_type": "Purchase",
    "action_source": "APP",
    "event_at": "2026-07-07T12:00:00.000Z",
    "event_source_url": "https://example.com/checkout?click_id=abc123",
    "click_id": "abc123",
    "conversion_id": "order-kitchen-sink-1",
    "event_metadata": { "currency": "USD", "value_decimal": 59.98, "item_count": 2 },
    "products": [
      { "category": "shoes", "id": "SKU-1", "name": "Runner", "quantity": 1, "item_price": 29.99 },
      { "category": "socks", "id": "SKU-2", "name": "Ankle Sock", "quantity": 1, "item_price": 29.99 }
    ],
    "user": {
      "email": "test@example.com",
      "phone_number": "+14155550123",
      "external_id": "identity-test",
      "ip_address": "127.0.0.1",
      "user_agent": "Mozilla/5.0",
      "advertising_id": "38400000-8cf0-11bd-b23e-10b96e40000d",
      "device_type": "ios",
      "uuid": "1700000000.123e4567-e89b-12d3-a456-426614174000",
      "data_processing_options": { "country": "US", "region": "CA", "modes": "LDU" },
      "screen_dimensions": { "height": 1920, "width": 1080 }
    }
  },
  "payload": { "type": "track", "event": "Order Completed", "userId": "user-001", "timestamp": "2026-07-07T12:00:00.000Z" }
}'
```

## F2. Kitchen-sink custom event (v3)

Same full surface via `customEvent`. Verify `type.tracking_type: CUSTOM` + `custom_event_name`, plus
all the same user/metadata paths.

```bash
curl --request POST \
  --url http://localhost:3000/customEvent \
  --header 'content-type: application/json' \
  --data '{
  "settings": { "ad_account_id": "YOUR_PIXEL_ID", "conversion_token": "YOUR_CONVERSION_TOKEN" },
  "features": { "reddit-conversions-api-canary-version": true },
  "mapping": {
    "custom_event_name": "Loyalty Signup Bonus",
    "action_source": "APP",
    "event_at": "2026-07-07T12:00:00.000Z",
    "event_source_url": "https://example.com/promo?click_id=xyz789",
    "click_id": "xyz789",
    "conversion_id": "custom-kitchen-sink-1",
    "event_metadata": { "currency": "USD", "value_decimal": 15.00, "item_count": 1 },
    "products": [
      { "category": "membership", "id": "SKU-M1", "name": "Gold Tier", "quantity": 1, "item_price": 15.00 }
    ],
    "user": {
      "email": "test@example.com",
      "phone_number": "+14155550123",
      "external_id": "identity-test",
      "ip_address": "127.0.0.1",
      "user_agent": "Mozilla/5.0",
      "advertising_id": "38400000-8cf0-11bd-b23e-10b96e40000d",
      "device_type": "android",
      "uuid": "1700000000.123e4567-e89b-12d3-a456-426614174111",
      "data_processing_options": { "country": "US", "region": "NY", "modes": "LDU" },
      "screen_dimensions": { "height": 2340, "width": 1080 }
    }
  },
  "payload": { "type": "track", "event": "Loyalty Signup Bonus", "userId": "user-001", "timestamp": "2026-07-07T12:00:00.000Z" }
}'
```

## F3. Bare-minimum standard event (v3)

Only the three required fields — no `user`, no `event_metadata`, no products. Verify the outbound
body omits `user` and `metadata` entirely (they should be absent, not `{}` or `undefined`).

```bash
curl --request POST \
  --url http://localhost:3000/standardEvent \
  --header 'content-type: application/json' \
  --data '{
  "settings": { "ad_account_id": "YOUR_PIXEL_ID", "conversion_token": "YOUR_CONVERSION_TOKEN" },
  "features": { "reddit-conversions-api-canary-version": true },
  "mapping": {
    "tracking_type": "PageVisit",
    "action_source": "WEBSITE",
    "event_at": "2026-07-07T12:00:00.000Z"
  },
  "payload": { "type": "page", "userId": "user-001", "timestamp": "2026-07-07T12:00:00.000Z" }
}'
```

## F4. Bare-minimum custom event (v3)

Only `event_at`, `action_source`, `custom_event_name`. Same omission check via `customEvent`.

```bash
curl --request POST \
  --url http://localhost:3000/customEvent \
  --header 'content-type: application/json' \
  --data '{
  "settings": { "ad_account_id": "YOUR_PIXEL_ID", "conversion_token": "YOUR_CONVERSION_TOKEN" },
  "features": { "reddit-conversions-api-canary-version": true },
  "mapping": {
    "custom_event_name": "Minimal Custom",
    "action_source": "WEBSITE",
    "event_at": "2026-07-07T12:00:00.000Z"
  },
  "payload": { "type": "track", "event": "Minimal Custom", "userId": "user-001", "timestamp": "2026-07-07T12:00:00.000Z" }
}'
```
