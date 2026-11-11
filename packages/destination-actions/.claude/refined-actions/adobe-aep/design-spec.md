# Adobe AEP (Customer Journey Analytics) Action Destination

**PRD:** "PRD: Adobe Customer Journey Analytics (AEP Streaming Ingestion) Destination" (Rohan Raman, updated 2026-10-26)

## 1. Background

Adobe Experience Platform (AEP) streaming ingestion accepts JSON records over HTTP. Records follow an XDM schema, are posted to a customer-created **inlet** (streaming connection), and land in an AEP **dataset** that Adobe Customer Journey Analytics (CJA) reads. Adobe quotes under 60 minutes to the data lake, and under 15 minutes to Real-Time Customer Profile if the dataset is profile-enabled.

| Term | Meaning |
|------|---------|
| XDM | Adobe's JSON schema format. Each dataset is tied to one XDM schema and the payload must match it. |
| Inlet / streaming connection | Endpoint the customer creates (Flow Service API, or AEP UI: Sources, HTTP API). Its ID is the `{CONNECTION_ID}` in the URL (`inletUrl` = `https://dcs.adobedc.net/collection/<id>`). |
| IMS Org ID | Customer's Adobe tenant identifier (IMS = Adobe's identity system). Must match the inlet. |
| Sandbox | Isolated partition of an org. The inlet belongs to one sandbox; all messages in one request go to the same org and sandbox. |
| Dataset ID | Dataset that receives the record; its schema must match the message's schema. |
| `identityMap` | A field inside the XDM record (not an API concept) listing identities by namespace (ECID, PID, ...). CJA uses it to stitch users. |

## 2. Requirements

### 2.1 Functional requirements

| Priority | Feature | Description | Requirements | Docs |
|----------|---------|-------------|--------------|------|
| P0 | Send Event action | Send Segment events to an AEP inlet as XDM ExperienceEvents | Track, Page and Screen events; envelope with `header` (schemaRef, imsOrgId, datasetId, flowId) and `body` (xdmMeta, xdmEntity); configurable inlet, schema, dataset and flow; byte-bounded batching | |
| P0 | Identity mapping | Build `identityMap` for CJA stitching | ECID from `anonymousId`, PID from `userId`, custom namespaces such as ECI; at least one identity per record | |
| P0 | XDM property mapping | Map event properties to XDM paths | Key-value mapping of dotted XDM paths, expanded to nested JSON; flag non-conforming fields where detectable | |
| P0 | Authentication and connection | Adobe IMS OAuth server-to-server | Client credentials flow, 24h token refresh, connection test on save | |
| P0 (conditional) | Upsert Profile action | Send Identify traits to a Profile dataset | PRD lists it as P0 "needed only if JPMC picks" the CJA query-time join (Q2); separate Individual Profile schema and dataset | |
| P0 | Lift-and-shift compatibility | Analytics ExperienceEvent Full Extension | Customers can map to `_experience.analytics.customDimensions.*` eVar/prop paths through `xdmMapping` (3.3.2). The PRD's automatic "Lift-and-Shift toggle" is a separate, unsized ask (Q16) | |
| Open | Linked Events | Enrich events with Data Graph entities at delivery | Requested in PRD comments (Sean Han) for consistency with other destinations (Q17) | |

### 2.2 Non Functional requirements

| Priority | Feature | Description | Requirements | Docs |
|----------|---------|-------------|--------------|------|
| P0 | Error handling and retry | Per-message results from a 207 Multi-Status response | Return a `MultiStatusResponse`; map 400/401/403/413/429/500/503 per message; re-auth on 401 | |
| P0 | Security | Protect customer credentials and PII | `clientSecret` as password field; never log tokens; reject `__proto__`, `constructor`, `prototype` in customer-entered XDM paths | |
| P0 | Throughput | PRD target of 25-30k events/sec | Adobe documents 1,000 requests/sec and 10,000 messages/sec; needs Adobe confirmation (see 3.3.4) | |
| P1 | Batching | Count- and byte-bounded batches | Always enabled, `batch_size` (default 100, range 10-250) plus hidden `batch_bytes` with headroom under Adobe's 1 MB request limit | |

## 3. Solution

We use the standard Actions framework and the platform's batching pipeline. The nuances are below.

### 3.1 Destination settings

| Setting | Type | Required | Sent as | Description | How a customer obtains it |
|---------|------|----------|---------|-------------|---------------------------|
| `clientId` | string | Yes (per PRD); may become optional for unauthenticated inlets (Q10) | `x-api-key` header; also the `client_id` in the token request | Adobe IMS OAuth server-to-server Client ID. | Shown as "API key (Client ID)" on the same credential page, after adding the Experience Platform API to a Developer Console project. |
| `clientSecret` | password | Yes (per PRD); see Q10 | Token request only (`client_secret`); never sent to the inlet | Adobe IMS OAuth server-to-server Client Secret. | Retrieved from the same credential page (unverified: Adobe's authentication page names the API key and Org ID, not the secret). Anyone with project access can view it, so treat as sensitive. |

### 3.2 Destination Authentication

Use `scheme: 'oauth2'` with a custom `refreshAccessToken` that does a `client_credentials` request with the customer's own client ID and secret.

```http
POST https://ims-na1.adobelogin.com/ims/token/v3
Content-Type: application/x-www-form-urlencoded

client_id={clientId}&client_secret={clientSecret}&grant_type=client_credentials&scope={SCOPE}
```

Expected response (illustrative, not captured from a live org): a JSON body with `access_token`, `token_type` and `expires_in`. The destination returns `{ accessToken: res.data.access_token }` from `refreshAccessToken`. Tokens last about 24 hours.

**Example: `testAuthentication` call.** Only the token request above is made (settings hold just the client ID and secret).

| Result | Meaning shown to the customer |
|--------|-------------------------------|
| Token request fails (400/401) | Client ID, client secret or scope is wrong |
| Token request succeeds | Credentials and scope work. Org ID, sandbox, inlet, schema, dataset and flow are not checked. |

### 3.3 Send Event Action

The `sendEvent` action (P0) sends Segment Track, Page and Screen events (default subscription `type = "track" or type = "page" or type = "screen"`) to `POST https://dcs.adobedc.net/collection/batch/{inletId}`.

#### 3.3.1 Action level fields

| Field | Required | Maps to (Adobe request) | Source / default mapping | Notes |
|-------|----------|-------------------------|--------------------------|-------|
| `imsOrgId` | Yes | `header.imsOrgId` on every message; `x-gw-ims-org-id` for Schema Registry calls | Customer-entered | Customer's Adobe IMS Org ID. Must match the inlet. Shown as "Organization ID" on the OAuth Server-to-Server credential page of the Developer Console project. |
| `sandboxName` | Yes | `x-sandbox-name` request header | Customer-entered | Required because Adobe's reference spec marks the header `required: true` on both ingestion operations; also needed for Schema Registry calls. Name of the sandbox holding the inlet, schema and dataset, listed in the AEP UI under Sandboxes (lookup path unverified). |
| `inletId` | Yes | URL path: `POST https://dcs.adobedc.net/collection/batch/{inletId}` | Customer-entered | Streaming connection (inlet) ID. Create an HTTP API streaming connection (Flow Service API, or AEP UI: Sources, HTTP API), then take the hex ID at the end of its `inletUrl`. UI path: Sources, HTTP API, View accounts, then the account's details page (community post, not official docs). |
| `schemaRefId` | Yes | `header.schemaRef.id` and `body.xdmMeta.schemaRef.id` | Customer-entered (XDM schema `$id` from the AEP Schema Registry) | Must be identical in `header` and `xdmMeta` and match the dataset's schema. **Schema prerequisites (Q18):** XDM ExperienceEvent class (the PRD's Send Event "maps event payloads to the AEP XDM ExperienceEvent schema") and the Identity Map field group (we always send `identityMap`, Q5); plus the Adobe Analytics ExperienceEvent Full Extension field group if eVar/prop paths are mapped. P1: dynamic schema picker (3.3.2), which can warn when `meta:class` is not ExperienceEvent. |
| `schemaRefContentType` | Yes | `header.schemaRef.contentType` and `body.xdmMeta.schemaRef.contentType` | Customer-entered (e.g. `application/vnd.adobe.xed-full+json;version=1`, the schema version) | Same in both places. |
| `datasetId` | Yes | `header.datasetId` | Customer-entered (dataset ID from the AEP UI or Catalog Service) | The dataset's schema must match `schemaRef`. |
| `flowId` | Yes | `header.flowId` | Customer-entered (dataflow ID of their HTTP API streaming source, via the Flow Service API or the AEP UI dataflows list) | Required in the header per Adobe's reference spec; Adobe's tutorial omits it (Q15, including whether a flow is one-to-one with an inlet). |
| `sourceName` | No | `header.source.name` | Customer-entered | If omitted, Adobe uses the source ID from the connection definition. |
| `eventId` | **Yes** (Q9) | `body.xdmEntity._id` | SHA-256 hex of `$.messageId` | The ExperienceEvent class marks `_id` required and says the sender generates it (by combining fields that make the event unique, then hashing). It must not contain `/`, `\`, `?` or `#` and is at most 1,023 bytes; hashing guarantees both. Profile drops an event whose `_id` already exists (the data lake keeps it), so retries of the same Segment message are deduplicated in Profile. The "system-generated" wording in the OpenAPI spec describes the example schema, not this class. |
| `timestamp` | **Yes** (Q9) | `body.xdmEntity.timestamp` | `$.timestamp`, ISO 8601 (RFC 3339) | Required by the ExperienceEvent class. Adobe: it **must** be in the past and from 1970 onwards, so future-dated events are invalid by Adobe's own rule (Q8). |
| `ecid` | No* | `body.xdmEntity.identityMap.ECID[].id` | `$.anonymousId` | ECID/MID namespace. |
| `pid` | No* | `body.xdmEntity.identityMap.PID[].id` | `$.userId` | Primary by default (Q5 rules below). |
| `customIdentities` | No | `body.xdmEntity.identityMap.<namespace>[].id` | Customer-mapped: array of `{namespace, value, primary?}` (e.g. the ECI cross-device anchor) | Namespace must exist in AEP Identity Service (Q7). |
| `xdmMapping` | Yes | Nested XDM fields in `body.xdmEntity` | Customer-mapped key-value object: XDM dotted path to a Segment value (e.g. `$.properties.*`) or a constant | Expanded to nested JSON (3.3.2); non-conforming fields are flagged or dropped. Also carries lift-and-shift paths such as `_experience.analytics.customDimensions.eVars.eVar5` (3.3.2). |
| `enable_batching` | No | n/a (platform batching) | Default on | Always enabled (3.3.4). |
| `batch_size` | No | n/a (platform batching) | Default 100, `minimum: 10`, `maximum: 250` | Max events per `performBatch` call. Floor and ceiling are derived in 3.3.4. |
| `batch_bytes` | No (hidden) | n/a (platform batching) | Default about 800 KB (800000), `unsafe_hidden: true` | Keeps batches under Adobe's 1 MB limit (3.3.4). |
| `batch_keys` | No (hidden) | n/a (platform batching) | Default `['imsOrgId','sandboxName','inletId']`, `unsafe_hidden: true` | Groups batches so each request has one URL and one `x-sandbox-name` (3.3.4). |

\* **Identity rules (Q5 decision).** The destination builds `identityMap` as follows:
1. **Drop blank identities.** An identity whose value is missing, `null` or an empty string is left out (Adobe does not accept null or empty values). If a namespace has no valid identities, its key is omitted.
2. **Exactly one `primary: true`** across all namespaces, chosen in this order: the first `customIdentities` entry flagged `primary`; otherwise PID (`userId`); otherwise the first custom identity; otherwise ECID (`anonymousId`). All other identities are sent with `primary: false`. If several custom identities are flagged `primary`, the first one wins and the rest are sent as not primary.
3. **At least one identity is required.** If no valid identity remains after step 1, the event is **rejected, not sent** (see 3.3.3). It is not sent without an `identityMap`, because Adobe's docs do not say what it does with an event that has none.

This matches Adobe's guidance for the Web SDK (a person-level identity is primary and the ECID is not when both exist; exactly one primary overall). Adobe's streaming docs do not state these rules or what happens without an identity, so they are our choices to confirm in a live org (4.1). A sole ECID being primary is our inference.

Segment Track event (input):

```json
{
  "type": "track",
  "event": "Order Completed",
  "messageId": "msg-123",
  "timestamp": "2026-11-02T10:30:00.000Z",
  "anonymousId": "ecid-abc",
  "userId": "user-42",
  "properties": { "order_id": "ORD-1", "revenue": 59.9, "currency": "USD" },
  "context": { "page": { "url": "https://shop.example.com/checkout" } }
}
```

Mapping:

| Field | Value |
|-------|-------|
| `schemaRefId` | `https://ns.adobe.com/acme/schemas/abc123` |
| `schemaRefContentType` | `application/vnd.adobe.xed-full+json;version=1` |
| `datasetId` | `ds-111` |
| `flowId` | `flow-222` |
| `eventId` | `$.messageId` (sent as its SHA-256 hex) |
| `timestamp` | `$.timestamp` |
| `ecid` | `$.anonymousId` |
| `pid` | `$.userId` |
| `xdmMapping` | `eventType` = `commerce.purchases` (constant); `commerce.order.purchaseID` = `$.properties.order_id`; `commerce.order.priceTotal` = `$.properties.revenue`; `commerce.order.currencyCode` = `$.properties.currency`; `web.webPageDetails.URL` = `$.context.page.url` |

Adobe request (one message in the batch; with batching, `messages` holds one entry per event):

```http
POST https://dcs.adobedc.net/collection/batch/{inletId}
Content-Type: application/json
x-sandbox-name: {sandboxName}
Authorization: Bearer {access_token}
```

```json
{
  "messages": [
    {
      "header": {
        "schemaRef": {
          "id": "https://ns.adobe.com/acme/schemas/abc123",
          "contentType": "application/vnd.adobe.xed-full+json;version=1"
        },
        "imsOrgId": "{imsOrgId}",
        "datasetId": "ds-111",
        "flowId": "flow-222"
      },
      "body": {
        "xdmMeta": {
          "schemaRef": {
            "id": "https://ns.adobe.com/acme/schemas/abc123",
            "contentType": "application/vnd.adobe.xed-full+json;version=1"
          }
        },
        "xdmEntity": {
          "_id": "<sha256 hex of msg-123>",
          "timestamp": "2026-11-02T10:30:00.000Z",
          "eventType": "commerce.purchases",
          "identityMap": {
            "ECID": [{ "id": "ecid-abc", "primary": false }],
            "PID": [{ "id": "user-42", "primary": true }]
          },
          "commerce": { "order": { "purchaseID": "ORD-1", "priceTotal": 59.9, "currencyCode": "USD" } },
          "web": { "webPageDetails": { "URL": "https://shop.example.com/checkout" } }
        }
      }
    }
  ]
}
```

#### 3.3.2 XDM property mapping

Customers map event properties to XDM paths with an `object` field using `additionalProperties: true` and `defaultObjectUI: 'keyvalue'` (a well-used pattern in this repo; 351 destinations use `defaultObjectUI`). `defaultObjectUI: 'object'` is an alternative where the customer pre-shapes a nested object in Segment; flat dotted paths are the default.

- explicit collision handling (`a` and `a.b` both mapped: later key wins vs `PayloadValidationError`);
- rejection of `__proto__`, `constructor` and `prototype` keys, because the keys are customer-entered;
- splitting on `.` being safe, since XDM sub-keys contain no dots (tenant namespaces start with `_tenantId`).

**Lift-and-shift (Adobe Analytics variables).** With the Adobe Analytics ExperienceEvent Full Extension field group in the schema, legacy variables are ordinary `xdmMapping` keys, so P0 needs no extra code. The paths are from Adobe's Analytics variable mapping page:

| Legacy AA variable | XDM path | Plain `xdmMapping` row? |
|---|---|---|
| eVar1-250 | `_experience.analytics.customDimensions.eVars.eVarN` | Yes (string) |
| prop1-75 | `_experience.analytics.customDimensions.props.propN` | Yes (string; Adobe: props accept only strings) |
| event1-1000 | `_experience.analytics.event1to100.eventN.value` (groups of 100) | Yes (number) |
| list1-3 | `_experience.analytics.customDimensions.lists.listN.list[].value` | No: array of objects |
| list props | `_experience.analytics.customDimensions.listProps.propN.values` | No: array |
| hier1-5 | `_experience.analytics.customDimensions.hierarchies.hierN` | Unverified sub-shape |
| pageName, linkName/Type/URL | `web.webPageDetails.name`, `web.webInteraction.name` / `.type` / `.URL` | Yes |
| products string | `productListItems[]` | No: array |

- Adobe's Analytics source connector writes eVars, props and events to the same paths, so customers whose CJA reports already read AA data through that connector keep their report definitions. That is the reason lift-and-shift reduces report rewrites.
- AA-only behavior (eVar persistence and allocation, processing rules, classifications) does not carry over; customers configure it again in the CJA data view.
- Non-string values sent to eVar/prop paths: whether to stringify in code or let Adobe reject them is open (Q19).
- The PRD's automatic toggle is Q16.

**Schema introspection.** Dynamic fields return choice lists, not per-key suggestions inside a key-value editor, and no `dependsOn` between dynamic fields was found.
- **P0:** manual path entry.
- **P1:** a dynamic schema picker backed by the Schema Registry (`GET https://platform.adobe.io/data/foundation/schemaregistry/tenant/schemas` with `Accept: application/vnd.adobe.xed-id+json`, max 300 per page) that fills `schemaRefId`, plus path validation against the schema fetched from `/tenant/schemas/{url-encoded $id}` with `Accept: application/vnd.adobe.xed-full+json; version=1` (resolved `$ref`/`allOf`). The resolved-properties shape is not shown in Adobe's docs and must be checked live.

#### 3.3.3 Multistatus response handling

Adobe returns **207 Multi-Status** for success, partial success and failure. A successful entry in `responses[]` has `xactionId`; a failed entry has `statusCode` and `message`. Succeeding messages are unaffected by failing ones, so only failed messages are resent.

- `performBatch` **must return a `MultiStatusResponse`** (exported from `@segment/actions-core`). If it returns anything else, the platform assumes the whole batch succeeded and Adobe's per-message failures are silently swallowed.
- **Events rejected before sending (Q5 decision).** An event with no valid identity (3.3.1) is **not** included in the Adobe request. Call `setErrorResponseAtIndex(i, { status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED', errormessage: 'No identity available: map at least one of anonymousId, userId or a custom identity', sent: <the payload> })`, as `rokt-capi/send/functions.ts` does for its own validation failures. Omit `body`, since there was no API response. The remaining events are still sent in one request. If every event in the batch is rejected, make no HTTP call at all.

| Adobe status | Report as | Retried |
|---|---|---|
| none (rejected locally: no valid identity, Q5) | error 400, `PAYLOAD_VALIDATION_FAILED`, no HTTP call for that event | No |
| 400 (bad request, unknown XDM format, or a schema mismatch: assumed, see below) | error 400 | No |
| 401 (missing auth header; authenticated inlets only) | error 401 | Token refresh and retry (core) |
| 403 (invalid/expired token; authenticated inlets only) | **map to 401** | Token refresh and retry (core) |
| 413 (over 1 MB) | error 413; should not occur with byte-bounded batching | No |
| 429 (throttled) | error 429 | Yes |
| 500 (internal/processing error) | error 500, treated as transient | Yes |
| 503 | error 503 (Adobe: retry at least 3 times with exponential backoff) | Yes |

Core's retryable set (`core/src/errors.ts:28`) is 408, 423, 429, 500, 502 to 511, 598 and 599, so 400 and 413 are not retried and 429, 500 and 503 are.

#### 3.3.4 Batching and throughput

The platform chunks events before calling `performBatch`, so "auto-split before 1 MB" is met by a `batch_bytes` default with headroom (about 800-900 KB), not by chunking in code. Keep `batch_bytes` `unsafe_hidden: true` (existing examples: `aws-kinesis/send`, `altertable/identify`). Still guard in code: if a single message alone exceeds the limit, report that index as a 413 error instead of failing the batch. Adobe states no maximum message count per request (its example bundles 200 x 1 KB messages). Expected size is about 3.5-4.5 KB per event as JSON (1.8 KB as CSV), under Adobe's soft 10 KB recommendation.

**Batch size and bytes settings.**

| Field | Default | Range | Exposed | Rationale |
|-------|---------|-------|---------|-----------|
| `batch_size` | 100 | min 10, max 250 | Yes (with min/max validation) | Floor from the request cap, ceiling from the 1 MB limit (below). |
| `batch_bytes` | 800000 (about 800 KB) | n/a | No (`unsafe_hidden: true`) | Real size guard when events are larger than average; stops a batch before `batch_size` is reached. |

- **Floor (10):** at 10,000 messages/sec and a 1,000 requests/sec cap, at least 10 messages per request are needed.
- **Default (100):** 10x above the floor, so the request cap is never the binding limit. About 450 KB at 4.5 KB per event, under 1 MB. At 10,000 messages/sec this is about 100 requests/sec, 10% of the request cap.
- **Ceiling (250):** about what 1 MB holds at the average event size (roughly 230 events).
- **Larger events:** at Adobe's 10 KB soft recommendation, 800 KB holds about 80 events, so `batch_bytes` binds before `batch_size`.
- **Cost of larger batches:** a 413 rejects the whole request, and a request-level failure (for example a 5xx) retries every message in it. Smaller batches limit that damage.
- **Time-based flush:** the PRD's "flush at ~800 KB or 5 s" time bound is the platform batcher's behavior, not a destination field; confirm the platform's flush interval with the platform team.
- **Batch keys:** `imsOrgId`, `sandboxName` and `inletId` are per request (URL path and `x-sandbox-name` header), so the action sets the hidden `batch_keys` field to those three. Events with different values then never share a batch.

**Request cap vs message cap.** Adobe applies two limits at the same time: 1,000 requests/sec counts HTTP calls regardless of how many messages each holds; 10,000 messages/sec counts the individual messages inside them. Both figures are confirmed on Adobe's streaming ingestion overview ("1000 requests per second" and "10000 individual messages per second").

| Batch size | Requests/sec to reach 10k msgs/sec | Which limit binds first |
|------------|------------------------------------|-------------------------|
| 1 | 10,000 | Requests (1,000 is reached at 1,000 msgs/sec) |
| 5 | 2,000 | Requests (1,000 is reached at 5,000 msgs/sec) |
| 10 | 1,000 | Both at once |
| 100 | 100 | Messages |

- Below about 10 messages per request the request cap is the bottleneck: throughput is batch size x 1,000 messages/sec.
- Above about 10 the message cap is the bottleneck: throughput stays at 10,000 messages/sec however large the batch.
- Batching is therefore the way to stay under the request cap, but it cannot raise the message ceiling. The PRD reasoned only about the request cap (30 events x 1,000 requests/sec = 30,000), which is 3x the message cap.
- Unconfirmed: whether either limit is soft or hard, and whether it applies per org, inlet or dataflow (Q14).

**Throughput concern (needs Adobe confirmation).**
- The PRD plans for **25-30k events/sec**, assuming at least 30 events per request to stay under a **1,000 RPS** soft cap on the batch endpoint, and cites 4,000-5,000 RPS for non-profile datasets.
- Adobe's streaming ingestion overview lists **1,000 requests/sec** and **10,000 individual messages/sec**. At 30 events per request, 1,000 requests/sec would carry 30,000 messages/sec, exceeding the stated 10,000. The PRD's 4,000-5,000 RPS claim does not match that page.
- Limits also tie to the customer's license entitlement, and development sandboxes are capped at 10% of total profiles.
- **JPMC update (PRD comment, Sean Han):** JPMC confirmed only the 1,000 RPS limit. At current throughput 20-30 events per request is enough; JPMC expects to reach 50K eventually, which needs about 50 events per request. Both fit the default `batch_size` of 100 against the request cap. The 10,000 messages/sec figure is not addressed.
- **Action:** confirm with Adobe which limit applies (for example JPMC's provisioned entitlement) before committing to the target (Q14). Late/future timestamp handling: see Q8.

### 3.4 Profile upsert

`upsertProfile` is P0 in the PRD, but only if JPMC picks the CJA query-time join (Q2). It uses the same batch endpoint and envelope with an Individual Profile schema and a profile dataset in the header (Q4, resolved from Adobe's docs), needs a separate schema and dataset from `sendEvent`, possibly a separate inlet (supported, since the inlet is chosen per action), and reuses the envelope, identity and XDM-building helpers.

**Why a separate action rather than reusing `sendEvent`.** A query-time join needs Individual Profile (record) data, while `sendEvent` writes ExperienceEvent (time-series) data. A dataset has one schema and one class, so Identify data sent through `sendEvent` lands as events, not as a joinable profile. One generic "send XDM record" action is technically possible (same endpoint), but each class has different required fields (`_id` and `timestamp` only for events), triggers (Identify vs Track/Page/Screen), default mappings (`$.traits` vs `$.properties`), datasets and batch keys.

**Design constraints:**
- The CJA join is on the Person ID, so `upsertProfile` and `sendEvent` must send the same primary identity (for example PID from `userId`) or the join silently returns nothing.
- Adobe's Individual Profile class page does not state required fields; confirm with a live schema.
- The trade-off for Q2: Option B shows a trait's current value for all events (smaller events, no per-event lookup, corrections apply to past events) but loses its value at event time. Option A (per-event enrichment, which JPMC uses today through an insert function and the Profile API) needs no new action.

## 4. Appendix

### 4.1 Prerequisites and test environment

**A licensed AEP org is required to fully build and verify this destination.** Code can be written and unit-tested against mocked responses without it, but several behaviors cannot be validated.

Required for development and testing:
- An Adobe org with **AEP entitlement** and a sandbox. Without it the **Experience Platform API cannot be added** to an Adobe Developer Console project (it shows as disabled under Add an API in the current test account).
- The developer added in Admin Console to an **Experience Platform product profile**, with the ABAC permissions needed for write operations.
- A **Developer Console project** with the Experience Platform API and **OAuth Server-to-Server** credentials (JWT is deprecated). This yields the Client ID and Org ID. Tokens must be refreshed every 24 hours.
- In the sandbox: an **HTTP API streaming connection (inlet)** with its **dataflow** (its ID is the required `flowId`), an **XDM schema** and a **dataset** for ExperienceEvents. A second schema and dataset are needed to test `upsertProfile`.

Depends on live AEP access (cannot be verified with mocks):
- Whether the Bearer token is needed on authenticated vs unauthenticated inlets, and how the customer enables it (Q10); OAuth scopes and token endpoint (Q10).
- Schema conformance and what AEP drops silently, real 207 per-message results, 413/429 behavior and actual throttling limits.
- Whether `flowId` and `x-sandbox-name` are enforced (Adobe's reference spec requires them; its tutorial example omits both).
- Schema Registry introspection (Q11) and the token-only `testAuthentication` against real credentials; late/future timestamps (Q8).

Can proceed without it: action definitions, field schemas, envelope and `identityMap`/nested XDM building, byte-bounded batching and 207 error handling, all tested with `nock` using fixtures from Adobe's documented examples.

Each customer needs the same setup in their own AEP org (licensed AEP, Developer Console project with OAuth Server-to-Server credentials, streaming connection, schema and dataset). **Action needed:** obtain an AEP-enabled org or sandbox (internal, via an Adobe partner contact, or a cooperating customer) before integration testing and any beta release.

### 4.2 Open questions

Resolved by Adobe docs (Tier 3 research): Q4 (profile records use the same batch endpoint and envelope) and Q9 (`_id` and `timestamp` required; alternate header form not supported); Q14's 1,000 requests/sec and 10,000 messages/sec figures confirmed on Adobe's overview page (which limit applies to a customer is still open).

Resolved by decision: Q5 (identity rules and rejection of events with no identity); Q12 (settings are only `clientId` and `clientSecret`; org, sandbox and inlet are action fields).

Resolved by Adobe docs: Q1 endpoint (`POST https://dcs.adobedc.net/collection/batch/{CONNECTION_ID}`); Q3 `schemaRef`/`datasetId` come from the message header with `imsOrgId` and `flowId`; `flowId` required in the header (reference spec); `sandboxName` required (`x-sandbox-name`); `operations` header field is not in the reference spec and was dropped; 401/403 occur only on inlets with authentication enabled.

Resolved by repo research (`repo-research-findings.md`): multi-status handling; Q10 OAuth scheme (`oauth2` + `refreshAccessToken`); Q6 nested JSON UI (key-value field plus own path helper); batching design.

| Id | Question | Status |
|----|----------|--------|
| Q2 | Profile enrichment path: per-event enrichment vs CJA query-time join (separate Profile Dataset). Decides whether `upsertProfile` ships. | Open (JPMC). PRD recommends the query-time join (Option B). PRD comment (Sean Han): for JPMC he assumed enrichment stays in the insert function querying the Profile API (Option A, no new action), with Linked Events in the new destination (Q17). Deciding factor: do JPMC reports need trait values at event time (A) or current values (B)? See 3.4. |
| Q4 | Endpoint and format for writing to a Profile Dataset. | **Resolved (Adobe docs):** same `POST /collection/batch/{inletId}` and same envelope. Adobe's spec says the batch endpoint's "message format remains identical" to the single-message endpoint, its record-data tutorial streams profile records to that single-message endpoint with the same header (`schemaRef`, `imsOrgId`, `datasetId`, `flowId`), and the batch tutorial says messages "can target the same or different datasets and schemas" (same org and sandbox). The profile dataset must be enabled for Real-Time Customer Profile and Identity Service to be used by Profile. Not stated outright: a batch example containing a profile record, so still smoke-test once. |
| Q5 | Behavior when neither `anonymousId` nor `userId` yields an identity; must one identity be `primary`? | Resolved (decision): drop blank identities; exactly one primary (custom flagged, else PID, else first custom, else ECID); an event with no identity is rejected with a 400 `PAYLOAD_VALIDATION_FAILED`, not retried (3.3.1, 3.3.3). To confirm in a live org: whether Adobe enforces one primary and what it does with no identity. |
| Q6 | XDM schema approach: lift-and-shift (Analytics ExperienceEvent Full Extension) vs clean semantic schema. | Open (customer decision). Both work through `xdmMapping` (3.3.2). PRD comment (Sean Han): for JPMC about 82% of mappings are lift-and-shift (71% custom dimensions, 11% analytics events); the other 18% (`web`, `environment`, `device`, `commerce`, `identityMap`, `_jpmcbankna.jpmcGlobalFields`) are semantic. |
| Q7 | Is ECI-based cross-device stitching actively used? If so the ECI namespace must be configured in AEP Identity Service and mapped via `identityMap`. | Open (PRD). PRD comment (Sean Han): namespaces can be introspected with the Identity Service API (`data/core/idnamespace/identities`), a P1 candidate for a `customIdentities` namespace dropdown. |
| Q8 | Out-of-order timestamps: how AEP/CJA handle extreme outliers (days late) and whether the late/future blocking logic must be retained. | Narrowed. Adobe's ExperienceEvent class says `timestamp` must be in the past and from 1970. PRD comment (Sean Han): "no restrictions on late/future or ordering with AEP"; a JPMC POC through a destination function has no blocking logic, so plan to drop it unless the POC review finds issues. Confirm how Adobe treats a future timestamp in a live org. |
| Q9 | Which XDM envelope fields are required, and is the tutorial's alternate header form (`msgType`, `msgId`, `xdmSchema`) relevant? | **Resolved (Adobe docs):** the ExperienceEvent class requires `_id` and `timestamp`; `eventType` and `identityMap` are optional. `_id` is sender-generated (hash of `messageId`), timestamp must be in the past and from 1970. The alternate header form appears only as the invalid fifth message in the tutorial's "valid and invalid messages" example, so it is not supported. `createdAt` stays unsent and `imsOrgId` is sent although Adobe adds it when omitted. |
| Q10 | OAuth token URL and scope; are `clientId`/`clientSecret` optional on unauthenticated inlets (then `required: false` and no bad header from `extendRequest`)? Which header carries the Client ID (`x-api-key`)? | Open |
| Q11 | Schema introspection: schema picker and path validation; per-key autocomplete is a UI-team ask. | Decision: out of v1 (backlog); v1 uses manual path entry |
| Q12 | Where do `imsOrgId`, `sandboxName` and `inletId` live? **Decision: action fields.** Settings hold only `clientId` and `clientSecret`; `testAuthentication` checks the credentials only. Remaining question: whether a flow is one-to-one with an inlet (Q15). | Resolved (decision); **differs from the PRD**, which lists "Client ID, Client Secret, IMS Org ID and Sandbox Name" as required settings and a connection test that "validates credentials and inlet on save". Get the PRD owner's agreement. |
| Q13 | Which platform component retries individual multi-status entries (confirm with the platform team)? Decision: schema mismatch is assumed to be a 400 (not retried) and 500 is retried as transient; verify the real status for a mismatch in a live org. | Platform-team part open; 500 mapping decided |
| Q14 | Throughput: 10,000 messages/sec documented vs the 25-30k events/sec target. | Open (Adobe). JPMC confirmed only the 1,000 RPS limit (3.3.4). |
| Q15 | `flowId`: how does a customer find it, is it enforced (the tutorial example omits it), and is a flow one-to-one with an inlet (making it an inlet-level setting)? | Open |
| Q16 | Lift-and-Shift toggle: the PRD says Segment "will map legacy properties to the `_experience.analytics.customDimensions.eVars.eVar[X]` XDM paths automatically". Manual mapping to these paths already works (3.3.2), so the toggle only saves entering the property-to-eVar table by hand. Where does that table come from? (a) If events reaching the destination already carry eVar/prop-named fields (JPMC sends to AA through BDIA, whose CSV columns are AA variables), the toggle routes `eVarN`/`propN`/`eventN` keys to their XDM paths: small, in-repo. (b) If the table lives in the legacy AA destination settings, the BDIA job or an insert function, it must be imported (Sean Han asked about importing an existing AA instance's mappings), which is control-plane work outside this repo. PRD fallback if not in v1: a setup warning that eVar/prop mappings do not carry over, plus a BDIA to AEP migration guide at GA. | Open (Sean Han, Rohan Raman; Varadarajan Vijayaragavan flagged it as "a big ask" needing research). Check JPMC's mapping file for (a) vs (b). |
| Q17 | Linked Events support (PRD comment, Sean Han). Linked Events enriches the event before the action runs, so `xdmMapping` can map the added fields; confirm with the Linked Events team what a destination must do to be enabled. | Open |
| Q18 | Schema prerequisites. A schema can have no identity at all (Adobe: identities are optional; a primary identity is needed only for Profile), and can use identity fields (descriptors) instead of `identityMap`. Q5 always sends `identityMap`, so v1 requires the Identity Map field group and the ExperienceEvent class. To confirm: what AEP does when `identityMap` is sent to a schema without the field group (reject vs drop); whether identity-field-only schemas need support later (Q5 rule 3 as a toggle). | Decision proposed: document as v1 prerequisites (3.3.1, setup guide) |
| Q19 | eVar/prop paths are string fields. Should `perform` stringify numbers and booleans mapped to `_experience.analytics.customDimensions.*`, or send them as mapped and let AEP reject them? | Open (small) |

Also open: Group and Alias are not covered by the PRD. Customer list (PRD comment, Sean Han): scan workspaces for active classic Adobe Analytics destinations (IBM also needs AEP) before beta. The legacy JPMC path is Segment to BDIA (Bulk Data Insertion API, CSV) to Adobe Analytics to CJA, while Segment's classic Adobe Analytics destination sends XML through the Data Insertion API, so JPMC's eVar mapping may not live in the classic destination (Q16). The reference spec was read from Adobe's docs repo; it is a static file and may lag the live reference page, so re-check `flowId` and the headers when AEP access is available.

### 4.3 Sources

- [Send multiple messages in a single HTTP request](https://experienceleague.adobe.com/en/docs/experience-platform/ingestion/tutorials/streaming-multiple-messages)
- [Streaming ingestion overview](https://experienceleague.adobe.com/en/docs/experience-platform/ingestion/streaming/overview)
- [Create an HTTP API streaming connection using the Flow Service API](https://experienceleague.adobe.com/en/docs/experience-platform/sources/api-tutorials/create/streaming/http)
- [Authenticate and access Experience Platform APIs](https://experienceleague.adobe.com/en/docs/experience-platform/landing/platform-apis/api-authentication)
- [Adobe streaming ingestion OpenAPI spec](https://github.com/AdobeDocs/experience-platform-apis/blob/main/static/swagger-specs/streaming-ingestion.yaml) (source for `flowId`, `x-sandbox-name`, `syncValidation`; rendered reference at [developer.adobe.com](https://developer.adobe.com/experience-platform-apis/references/streaming-ingestion))
- [Schema Registry API: schemas](https://experienceleague.adobe.com/en/docs/experience-platform/xdm/api/schemas) and [getting started](https://experienceleague.adobe.com/en/docs/experience-platform/xdm/api/getting-started)
- `repo-research-findings.md` (same folder): repo-side research by a peer Claude session (`action-destinations-e5`); its code references were not independently re-checked.
- [XDM ExperienceEvent class](https://experienceleague.adobe.com/en/docs/experience-platform/xdm/classes/experienceevent) (`_id` and `timestamp` required, `_id` format rules)
- [Streaming record data](https://experienceleague.adobe.com/en/docs/experience-platform/ingestion/tutorials/streaming-record-data) (profile records, same header)
- [Streaming ingestion overview](https://experienceleague.adobe.com/en/docs/experience-platform/ingestion/streaming/overview) (1,000 requests/sec, 10,000 messages/sec)
- [Community: discovering the inletId](https://experienceleaguecommunities.adobe.com/t5/journey-optimizer-questions/discover-inletid-for-profile-automating-update/td-p/789580) (non-official)
- [Basics of schema composition](https://experienceleague.adobe.com/en/docs/experience-platform/xdm/schema/composition) (classes, field groups; primary identity needed only for Profile)
- [XDM Individual Profile class](https://experienceleague.adobe.com/en/docs/experience-platform/xdm/classes/individual-profile) (required fields not stated)
- [Identity Map field group](https://experienceleague.adobe.com/en/docs/experience-platform/xdm/field-groups/profile/identitymap) and [defining identity fields](https://experienceleague.adobe.com/en/docs/experience-platform/xdm/ui/fields/identity) (Q18)
- [Adobe Analytics ExperienceEvent Full Extension field group](https://experienceleague.adobe.com/en/docs/experience-platform/xdm/field-groups/event/analytics-full-extension) (eVar1-250, prop1-75, 1,000 events)
- [Analytics variable mapping in XDM](https://experienceleague.adobe.com/en/docs/analytics/implementation/aep-edge/xdm-var-mapping) (paths in 3.3.2)
- [Analytics source connector](https://experienceleague.adobe.com/en/docs/experience-platform/sources/connectors/adobe-applications/analytics) and [its field mapping](https://experienceleague.adobe.com/en/docs/experience-platform/sources/connectors/adobe-applications/mapping/analytics) (eVars land in the same `_experience.analytics` paths; rows marked deprecated on that page)
- [Segment: Adobe Analytics destination](https://www.twilio.com/docs/segment/connections/destinations/catalog/adobe-analytics) and [mapping](https://www.twilio.com/docs/segment/connections/destinations/catalog/adobe-analytics/settings) (classic destination, Data Insertion API XML)
- [Bulk Data Insertion API](https://developer.adobe.com/analytics-collection-apis/methods/bulk-data-insertion/) (legacy JPMC path)

