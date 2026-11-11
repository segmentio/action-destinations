# Refined Actions: Adobe Customer Journey Analytics (AEP)

Generated: 2026-10-29
Updated: 2026-10-30 (incorporates Adobe's streaming ingestion docs, Adobe's OpenAPI reference spec and repo-side research)
Updated: 2026-11-10 (PRD priorities and comments, schema prerequisites, lift-and-shift paths, Upsert Profile rationale; new Q16-Q19)
Source: PRD analysis ("PRD: Adobe Customer Journey Analytics (AEP Streaming Ingestion) Destination", last updated 2026-10-26) plus Adobe Experience League docs, Adobe's `streaming-ingestion.yaml` OpenAPI spec and `repo-research-findings.md` (see Sources)

---

## 0. Background: AEP Streaming Ingestion

Streaming ingestion sends JSON records to Adobe Experience Platform (AEP) over HTTP. Records are formatted to an XDM schema, posted to a customer-created **inlet** (streaming connection), and land in an AEP **dataset** that CJA reads. Per Adobe, latency is under 60 minutes to the data lake, and under 15 minutes to Real-Time Customer Profile if the dataset is profile-enabled.

| Term | Meaning |
|------|---------|
| XDM | Adobe's JSON schema format. Each dataset is tied to one XDM schema and the payload must match it. |
| Inlet / streaming connection | Endpoint the customer creates (Flow Service API or UI: Sources, HTTP API). Its ID is the `{CONNECTION_ID}` in the URL (`inletUrl` = `https://dcs.adobedc.net/collection/<id>`). |
| IMS Org ID | Customer's Adobe tenant identifier (IMS = Adobe's identity system). Must match the inlet. |
| Sandbox | Isolated partition of an org. The inlet belongs to one sandbox; all messages in one request go to the same org and sandbox. |
| Dataset ID | Dataset that receives the record; its schema must match the message's schema. |
| `identityMap` | A field inside the XDM record (not an API concept) listing identities by namespace (ECID, PID, ...). Used by CJA to stitch users. |

---

## 1. Destination Configuration

| Setting | Type | Required | Description | How a customer obtains it |
|---------|------|----------|-------------|---------------------------|
| `clientId` | string | Yes (per PRD); see Q10 | Adobe IMS OAuth server-to-server Client ID; sent as `x-api-key` where required. | Shown as "API key (Client ID)" on the same OAuth Server-to-Server credential page, after adding the Experience Platform API to a Developer Console project. |
| `clientSecret` | password | Yes (per PRD); see Q10 | Adobe IMS OAuth server-to-server Client Secret. | Retrieved from the same OAuth Server-to-Server credential page (unverified: Adobe's authentication page names the API key and Org ID but not the secret). Anyone with access to the project can view it, so treat as sensitive. |

> All of the above require the customer to have a licensed AEP org with their developer added to an Experience Platform product profile (see Section 5).

**Settings are only `clientId` and `clientSecret` (decision on Q12).** The customer-entered **action-level** fields `imsOrgId`, `sandboxName` and `inletId` are entered per mapping, so one destination instance can write to several orgs, sandboxes or inlets. Where to find them: `imsOrgId` is shown as "Organization ID" on the OAuth Server-to-Server credential page of the Developer Console project and must match the inlet; `sandboxName` is the sandbox that holds the inlet, schema and dataset (AEP UI under Sandboxes, lookup path unverified) and is sent as the required `x-sandbox-name` header (Adobe spec: `required: true` on both ingestion operations); `inletId` is the hex ID at the end of the streaming connection's `inletUrl` (`https://dcs.adobedc.net/collection/<id>`), found via the Flow Service API or the AEP UI under Sources, HTTP API, View accounts, then the account's details page (UI path is from a community post, not official docs). Tradeoff: no destination-level default, so a single-org customer repeats the same three values on every mapping.

**Action-level fields customers also have to look up** (see `sendEvent` and `upsertProfile`): `schemaRefId` and `schemaRefContentType` come from the XDM schema in the AEP Schema Registry (the schema's `$id` and its version), `datasetId` comes from the dataset in the AEP UI or Catalog Service, and `flowId` is the ID of the dataflow created for their HTTP API streaming source (Adobe: "the ID of the dataflow"; look it up via the Flow Service API or the AEP UI dataflows list). None of these lookup paths is confirmed against Adobe's docs yet.

**Authentication Method:** OAuth 2.0 (Adobe IMS, server-to-server). Access tokens expire every 24 hours and must be refreshed. Per Adobe, 401/403 are "returned only for inlets with authentication enabled", so the Bearer token is only required when the customer's inlet has authentication enabled (see Q10).

**Implementation approach (repo research):** use `scheme: 'oauth2'` with a custom `refreshAccessToken` doing a `client_credentials` request with the customer's own client ID/secret, not `oauth-managed` (that is for Segment-owned OAuth apps with an authorization-code flow). Closest in-repo template: `listrak/index.ts`. `extendRequest` adds `Authorization: Bearer` and `x-api-key` (from the settings and token), and must not send a bad header if credentials are absent on an unauthenticated inlet. It does not set `x-sandbox-name` or the inlet URL; those come from the action payload and are set per request in `perform`/`performBatch`. Core already refreshes the token and retries when an HTTP response or a multi-status result contains a **401** (`core/src/destination-kit/index.ts`, bounded by `MAX_ATTEMPTS`). It keys on 401 only, and Adobe uses 403 for an invalid or expired token, so **map Adobe 403 to 401** in the per-message status or the refresh will not fire. A 403 caused by a wrong org or sandbox then triggers a refresh that cannot fix it; the retry is bounded by `MAX_ATTEMPTS`, and the error message should name the org and sandbox as the likely cause. Token URL and scope are still unknown (Q10).

**Token endpoint (research update):** `POST https://ims-na1.adobelogin.com/ims/token/v3`, `Content-Type: application/x-www-form-urlencoded`, body `client_id`, `client_secret`, `grant_type=client_credentials`, `scope` (Adobe Developer Console OAuth Server-to-Server guide). Probable, not yet run: non-US hosts and the AEP `scope` value. Adobe's docs give no AEP scope string and the ingestion reference names no scope or permission (Q10).

**Connection test (`testAuthentication`), works with only `clientId` and `clientSecret`:**
  - **What it does:** fetch a token with the client ID, secret and scope (token endpoint above) and report failure as bad credentials or scope. Nothing else is called, because the org ID, sandbox and inlet are action fields and are not available when the connection is saved.
  - **What a pass means:** the credentials and scope are valid; org ID, sandbox, inlet, schema, dataset and flow are not checked. **This is narrower than the PRD's "validates credentials and the inlet on save"**, and the PRD also lists IMS Org ID and Sandbox Name as required settings; flag both to the PRD owner.
  - **Where the rest is checked:** the P1 Schema Registry read (`GET https://platform.adobe.io/data/foundation/schemaregistry/stats` or `/tenant/schemas`, with `Authorization`, `x-api-key`, `x-gw-ims-org-id` and `x-sandbox-name`) moves to the action-level schema picker, which has the org ID and sandbox from the mapping. Otherwise a wrong org, sandbox or inlet shows as a 400/403 per message on the first event.
  - **Fetch its own token:** core's `testAuthentication` (`core/src/destination-kit/index.ts`) builds its request client from `extendRequest` and the `auth` data it is given, and does not call `refreshAccessToken`. Client credentials has no browser authorization step, so a stored token may not exist at first save. Share one `getAccessToken(request, settings)` helper between `refreshAccessToken` and `testAuthentication`, and do not store the test token.
  - **Unauthenticated inlets:** if Q10 confirms credentials are optional, skip the token check when they are blank.
  - **Not used:** a deliberately invalid probe to the inlet (unclear whether Adobe stores it as an error batch, and 207 hides failures), a real test message (writes customer data), or a Flow Service read of the streaming connection (needs an `inletId` the settings no longer hold).

> `schemaRef`, `datasetId` and `flowId` are modeled as **action-level fields** (section 2), not settings. Events and profiles use different schemas and datasets, and a single request may target different datasets (see Q3, resolved). Whether `flowId` is one-to-one with an inlet is Q15; `imsOrgId`, `sandboxName` and `inletId` are also action-level fields (Q12 decision).

---

## 2. Required Actions

### Action: Send Event
- **Action Name:** `sendEvent`
- **Slug:** `send-event`
- **Trigger:** Segment Track, Page or Screen call
- **Segment Source:** Track, Page, Screen
- **Default Subscription:** `type = "track" or type = "page" or type = "screen"`
- **Pattern:** Batch (byte-bounded)
- **Endpoints:** `POST https://dcs.adobedc.net/collection/batch/{inletId}`
- **Priority:** P0

**Request body (per Adobe):** a single `messages` array. Each message has a `header` (where the record goes) and a `body` (the record).

```json
{
  "messages": [
    {
      "header": {
        "schemaRef": { "id": "https://ns.adobe.com/{TENANT}/schemas/{ID}",
                       "contentType": "application/vnd.adobe.xed-full+json;version={V}" },
        "imsOrgId": "{ORG_ID}",
        "datasetId": "{DATASET_ID}",
        "flowId": "{FLOW_ID}",
        "source": { "name": "optional source name" }
      },
      "body": {
        "xdmMeta": { "schemaRef": { "...same as header..." } },
        "xdmEntity": { "_id": "uuid", "timestamp": "ISO-8601", "identityMap": { }, "...mapped XDM fields..." }
      }
    }
  ]
}
```

Per Adobe's OpenAPI reference spec (`streaming-ingestion.yaml`, operation `postBatchOfStreamingMessages`), the message `header` **requires `schemaRef`, `imsOrgId`, `datasetId` and `flowId`**, and `body` requires `xdmMeta` and `xdmEntity`. `flowId` is "the ID of the dataflow", used to target a specific dataflow when the account has been used to create multiple dataflows. `source.name` is optional (if omitted, Adobe adds the source ID from the streaming connection definition). `createdAt` appears in Adobe's tutorial example but the reference describes it as "automatically generated", so it is no longer sent by default (see field table).

**Headers:**
- `x-sandbox-name: {sandboxName}` (**required**, per the reference spec).
- `Content-Type: application/json` (**required**; Adobe also accepts `application/x-jackson-smile`).
- `Authorization: Bearer {token}`, only for inlets that have authorization enabled.

> **Discrepancy to verify live:** Adobe's tutorial ("Send multiple messages in a single HTTP request") shows only `Authorization` and `Content-Type` headers and its example message omits `flowId`, while the reference spec marks `x-sandbox-name` and `flowId` as required. The reference is the stricter source, so this blueprint follows it. Confirm against a real inlet whether the omissions are tolerated (needs AEP access).

**Key Fields:**

| Field | Destination Name | Type | Required | Segment Source | Transform |
|-------|-----------------|------|----------|----------------|-----------|
| `imsOrgId` | `header.imsOrgId` on every message; `x-gw-ims-org-id` for Schema Registry calls | string | Yes | user-entered | None |
| `sandboxName` | `x-sandbox-name` request header | string | **Yes** (Adobe spec: required header) | user-entered | None |
| `inletId` | URL path `/collection/batch/{inletId}` | string | Yes | user-entered | None |
| `schemaRefId` | `header.schemaRef.id` and `body.xdmMeta.schemaRef.id` | string | Yes | user-entered | None. Schema must use the ExperienceEvent class and include the Identity Map field group (Q18) |
| `schemaRefContentType` | `header.schemaRef.contentType` and `body.xdmMeta.schemaRef.contentType` (e.g. `application/vnd.adobe.xed-full+json;version=1`) | string | Yes | user-entered | None |
| `datasetId` | `header.datasetId` | string | Yes | user-entered | None |
| `flowId` | `header.flowId` | string | **Yes** (Adobe reference spec lists it as required in the message header) | user-entered | None |
| `sourceName` | `header.source.name` | string | No | user-entered | None; if omitted Adobe fills in the source ID from the connection definition |
| `eventId` | `body.xdmEntity._id` | string | **Yes** (ExperienceEvent class; Q9 resolved) | `$.messageId` | SHA-256 hex (no `/`, `\`, `?`, `#`; max 1,023 bytes) |
| `timestamp` | `body.xdmEntity.timestamp` | string (ISO-8601) | **Yes** (ExperienceEvent class; must be in the past and from 1970) | `$.timestamp` | None |
| `ecid` | `xdmEntity.identityMap.ECID[].id` (ECID/MID namespace) | string | No* | `$.anonymousId` | None |
| `pid` | `xdmEntity.identityMap.PID[].id` | string | No* | `$.userId` | None |
| `customIdentities` | `xdmEntity.identityMap.<namespace>[].id` (e.g. ECI cross-device anchor) | object/array of {namespace, value, primary?} | No | user-mapped | None |
| `xdmMapping` | nested XDM fields in `xdmEntity` | object keyed by XDM path | Yes | user-mapped (event properties) | Build nested JSON from XDM paths; drop/flag non-conforming fields |
| `enable_batching` | n/a | boolean | No | n/a | n/a |
| `batch_bytes` | n/a (platform batching) | number | No (hidden) | n/a | n/a |
| `batch_keys` | n/a (platform batching) | string[] | No (hidden) | n/a | Default `['imsOrgId','sandboxName','inletId']`: per-request values (URL path, `x-sandbox-name`), so events with different values never share a batch |

\* At least one identity must be present. **Q5 decision:** drop blank identities; exactly one `primary: true` (first custom identity flagged primary, else PID, else first custom, else ECID, others `primary: false`); an event with no valid identity is rejected before sending with a per-message 400 `PAYLOAD_VALIDATION_FAILED` (not retried, other events still sent), and `perform` throws `PayloadValidationError`. Details in `design-spec.md` 3.3.1 and 3.3.3.

**Considerations:**
- The destination wraps each mapped XDM record in the `header` + `body.xdmMeta` + `body.xdmEntity` envelope. `schemaRef` must appear identically in `header` and `xdmMeta`, and it must also match the schema of the dataset in `datasetId`.
- `x-sandbox-name` is sent on every request, so `sandboxName` is a required action field (earlier drafts of this blueprint wrongly treated it as possibly unneeded for ingestion).
- `createdAt`: Adobe's reference describes it as "a timestamp to date the creation of the connection. This is automatically generated", so it is not mapped by default. Adobe's tutorial example still sends it; only live testing shows whether sending or omitting matters.
- The single-message operation (`POST /collection/{CONNECTION_ID}`) also supports an optional `syncValidation=true` query parameter for immediate feedback during development (limited to 60 requests per minute per connection). It is not on the batch endpoint, so it isn't usable from this destination. Only useful for manual debugging against the single-message endpoint.
- Identity mapping (ECID/MID, PID, custom e.g. ECI) builds `identityMap` inside `xdmEntity`. It is part of this action, not a separate action.
- Property mapping targets **XDM paths** rather than a fixed right-hand side (eVars). Flag fields that don't conform to the schema where detectable, since AEP drops them.
  - **UI:** an `object` field with `additionalProperties: true` and `defaultObjectUI: 'keyvalue'` gives the key-value editor where the customer types the XDM path and maps a value (a well-used pattern in this repo). `defaultObjectUI: 'object'` is an alternative where the customer pre-shapes a nested object in Segment; offer flat dotted paths as the default.
  - **Nested JSON:** core has no helper that expands dotted keys into nested JSON (`core` exports `get`, no `set`). Write a small, unit-tested `setPath(obj, 'a.b.c', v)` in the destination with explicit collision handling (`a` and `a.b` both mapped: later key wins vs `PayloadValidationError`) and **rejection of `__proto__`, `constructor` and `prototype` keys**, because the keys are customer-entered. XDM sub-keys don't contain dots (tenant namespaces start with `_tenantId`), so splitting on `.` is safe.
  - **Introspection:** dynamic fields return choice lists, not per-key suggestions inside a key-value editor, and no `dependsOn` between dynamic fields was found. Ship **manual path entry in P0**. Introspection is P1: a dynamic dropdown of schemas (feeds `schemaRefId`) and validating mapped paths against the fetched schema. True per-key path autocomplete is a UI-team ask (Q11).
- **Response handling (critical):** Adobe returns `207 Multi-Status` for success, partial success and failure. Read `responses[]`: a successful entry has `xactionId`; a failed entry has `statusCode` and `message`. Succeeding messages are unaffected by failing ones, so only failed messages are resent.
  - `performBatch` **must return a `MultiStatusResponse`** (exported from `@segment/actions-core`). If it returns anything else, the platform assumes the whole batch succeeded and Adobe's per-message failures are silently swallowed.
  - Make one HTTP request, loop over `responses[]`, and match entry n to payload n by index into the payloads passed to `performBatch` (payloads that failed validation are already filtered upstream).
  - Use `setSuccessResponseAtIndex(i, { status, sent, body })` and `setErrorResponseAtIndex(i, { status, errormessage, sent, body })`. Include `sent` and `body` on API-originated errors so they are attributed to the destination, not to integrations.
  - In-repo templates: `rokt-capi/send/functions.ts` (primary), `ms-bing-capi/sendEvent`, `quora/trackConversion`, `amazon-conversions-api/trackConversion`.
- **Status codes and retry mapping (per message, from `responses[].statusCode`):**

  | Adobe status | Report as | Retried |
  |---|---|---|
  | 400 (bad request / unknown XDM format) | error 400 | No |
  | 401 (missing auth header; authenticated inlets only) | error 401 | Token refresh and retry (core) |
  | 403 (invalid/expired token; authenticated inlets only) | **map to 401** | Token refresh and retry (core) |
  | 413 (over 1 MB) | error 413; should not occur with byte-bounded batching | No |
  | 429 (throttled) | error 429 | Yes |
  | 500 (internal/processing error) | error 500, treated as transient | Yes |
  | 503 | error 503 (Adobe: retry at least 3 times with exponential backoff) | Yes |

  Core's retryable set (`core/src/errors.ts:28`) is 408, 423, 429, 500, 502 to 511, 598 and 599, so 400 and 413 are not retried and 429, 500 and 503 are. The repo only shows the 401 re-auth loop for multi-status. The code that retries individual multi-status entries by status lives outside this repo (the platform component calling `performBatch`), so **confirm with the platform team** that per-entry 429/503 are retried (Q13).
- Failed messages are stored in an "error" batch in the target dataset (Adobe's "retrieving failed batches" guide), useful for customer debugging.
- **Batching:** the platform chunks events before calling `performBatch` (repo guideline), so the "auto-split before 1 MB" requirement is met by a `batch_bytes` default with headroom (e.g. 800-900 KB), not by chunking in code. Keep `batch_bytes` `unsafe_hidden: true`. Still guard in code: if a single message alone exceeds the limit, report that index as a 413 error instead of failing the batch. Existing `batch_bytes` examples: `aws-kinesis/send`, `altertable/identify`. Adobe states no max message count per request (its example bundles 200 x 1 KB messages). Expected size ~3.5-4.5 KB/event (JSON) vs 1.8 KB CSV, under Adobe's soft 10 KB recommendation.
- **Throughput conflict:** see Section 4 and Q14.
- **Schema prerequisites (Q18):** ExperienceEvent class (the PRD's Send Event "maps event payloads to the AEP XDM ExperienceEvent schema") and the Identity Map field group, since Q5 always sends `identityMap`. A schema without identities is valid in AEP (a primary identity is only needed for Profile), but this action does not support it in v1.
- **P0 Lift-and-Shift (Analytics ExperienceEvent Full Extension):** handled via `xdmMapping` by targeting `_experience.analytics.*` paths; the schema must include the Full Extension field group. No separate action. Paths (Adobe's Analytics variable mapping page):
  - eVars: `_experience.analytics.customDimensions.eVars.eVar1`-`eVar250` (string)
  - props: `_experience.analytics.customDimensions.props.prop1`-`prop75` (string only)
  - events: `_experience.analytics.event1to100.event1.value` (groups of 100 up to `event901to1000`)
  - lists (`lists.listN.list[].value`), list props (`listProps.propN.values`) and `productListItems[]` are arrays, so plain `xdmMapping` rows cannot build them; they need code if required.
  - Adobe's Analytics source connector writes to the same paths, so existing CJA reports on AA data keep working; AA eVar persistence, processing rules and classifications must be configured again in CJA.
  - The PRD's automatic "Lift-and-Shift toggle" is unsized (Q16). Stringifying values for eVar/prop paths is Q19.
- Late/future timestamp handling (Q8): Sean Han's PRD comment says AEP has no restrictions and the JPMC POC has no blocking logic; Adobe's ExperienceEvent class says `timestamp` must be in the past. Plan: no blocking in the destination, confirm future-timestamp behavior live.
- Linked Events (Q17): enriched fields arrive on the event before the action runs and are mapped with `xdmMapping`; confirm enablement requirements with the Linked Events team.

---

### Action: Upsert Profile
- **Action Name:** `upsertProfile`
- **Slug:** `upsert-profile`
- **Trigger:** Segment Identify call
- **Segment Source:** Identify
- **Default Subscription:** `type = "identify"`
- **Pattern:** Upsert (batch candidate)
- **Endpoints:** The same `POST https://dcs.adobedc.net/collection/batch/{inletId}` with the Individual Profile schema and profile dataset in the message header (Q4 resolved from Adobe's docs; smoke-test once).
- **Priority:** P0 in the PRD, conditional: "Needed only if JPMC picks" the CJA query-time join (Q2)

**Key Fields:**

| Field | Destination Name | Type | Required | Segment Source | Transform |
|-------|-----------------|------|----------|----------------|-----------|
| `imsOrgId` | `header.imsOrgId` on every message; `x-gw-ims-org-id` for Schema Registry calls | string | Yes | user-entered | None |
| `sandboxName` | `x-sandbox-name` request header | string | **Yes** (Adobe spec: required header) | user-entered | None |
| `inletId` | URL path `/collection/batch/{inletId}` | string | Yes | user-entered | None |
| `schemaRefId` | `header.schemaRef.id` / `xdmMeta.schemaRef.id` | string | Yes | user-entered | None |
| `schemaRefContentType` | `header.schemaRef.contentType` / `xdmMeta.schemaRef.contentType` | string | Yes | user-entered | None |
| `datasetId` | `header.datasetId` (profile dataset) | string | Yes | user-entered | None |
| `flowId` | `header.flowId` | string | **Yes** (required in the message header per Adobe's reference spec) | user-entered | None |
| `ecid` | `xdmEntity.identityMap.ECID[].id` | string | No* | `$.anonymousId` | None |
| `pid` | `xdmEntity.identityMap.PID[].id` | string | No* | `$.userId` | None |
| `customIdentities` | `xdmEntity.identityMap.<namespace>[].id` | object/array | No | user-mapped | None |
| `xdmMapping` | Individual Profile XDM paths in `xdmEntity` | object keyed by XDM path | Yes | user-mapped (`$.traits.*`) | Build nested JSON from XDM paths |

\* At least one identity must be present; same Q5 rules as `sendEvent`.

**Considerations:**
- Maps traits (e.g. CI3 Customer Attributes) to the AEP Individual Profile XDM schema.
- Needs a separate schema and dataset from `sendEvent`, and possibly a separate inlet (supported, since the inlet is chosen per action).
- Becomes required for customers choosing the CJA query-time join over per-event enrichment.
- Reuses the envelope, identity and XDM-building helpers from `sendEvent`.
- **Why not `sendEvent`:** the join needs Individual Profile (record) data; `sendEvent` writes ExperienceEvent (time-series) data, and a dataset has one schema and class. A single generic action is possible (same endpoint) but mixes class-dependent required fields (`_id`/`timestamp`), triggers, default mappings and batch keys.
- **Join key:** must send the same primary identity as `sendEvent` (for example PID from `userId`), or CJA's join on Person ID returns nothing.
- **Open:** Adobe's Individual Profile class page does not state required fields; confirm with a live schema.
- **Trade-off for Q2:** query-time join shows current trait values for all events (smaller events, no per-event lookup, corrections apply to past events) but loses point-in-time values. Per-event enrichment (JPMC today: insert function plus Profile API; or Linked Events, Q17) needs only `sendEvent`.

---

## 3. Implementation Plan

| Order | Action | Reason |
|-------|--------|--------|
| 1 | Destination auth + `testAuthentication` | IMS token handling/refresh (24h) underpins every request; `testAuthentication` validates the credentials only |
| 2 | `sendEvent` (envelope, identityMap, XDM mapping, byte-bounded batching, 207 per-message handling) | Core P0; covers Identity Mapping, Property Mapping, Batching & Throughput |
| 3 | `upsertProfile` | P0 in the PRD but conditional on the enrichment decision (Q2) |
| 4 | Lift-and-Shift toggle | Only if Q16 resolves to the small in-repo option (events already carry eVar/prop-named fields); otherwise PRD fallback (setup warning and migration guide) |

---

## 4. Throughput Concern (needs Adobe confirmation)

- The PRD plans for customers pushing **25-30k events/sec**, assuming at least 30 events per request to stay under a **1,000 RPS** soft cap on the batch endpoint, and cites 4,000-5,000 RPS for non-profile datasets.
- Adobe's streaming ingestion overview lists **1,000 requests/sec** and **10,000 individual messages/sec**. At 30 events/request, 1,000 requests/sec would carry 30,000 messages/sec, which exceeds the stated 10,000 messages/sec. The PRD's 4,000-5,000 RPS claim does not match this page.
- Limits also tie to the customer's license entitlement, and development sandboxes are capped at 10% of total profiles.
- **JPMC update (PRD comment, Sean Han):** JPMC confirmed only the 1,000 RPS limit; 20-30 events per request covers current throughput, and about 50 per request covers JPMC's eventual 50K. Both fit the default `batch_size` of 100. The 10,000 messages/sec figure is not addressed.
- The PRD's "flush at ~800 KB or 5 s" time bound belongs to the platform batcher, not a destination field; confirm with the platform team.
- **Action:** confirm with Adobe which limit applies (e.g. JPMC's provisioned entitlement) before committing to the 25-30k events/sec target.

---

## 5. Prerequisites & Test Environment

**A licensed Adobe Experience Platform (AEP) org is required to fully build and verify this destination.** Code can be written and unit-tested against mocked responses without it, but the items below cannot be validated without real AEP access.

**Required for development and testing**
- An Adobe org with **AEP entitlement** and a sandbox. AEP is a paid product; without the entitlement the **Experience Platform API cannot be added** to an Adobe Developer Console project. It shows as disabled under Add an API, as seen in the current test account (an org without AEP provisioned).
- The developer must be added in Admin Console to an **Experience Platform product profile**, and a system admin must grant the ABAC permissions needed for write operations.
- An **Adobe Developer Console project** with the Experience Platform API added, using **OAuth Server-to-Server** credentials (JWT is deprecated). This yields the Client ID and Org ID. Tokens must be refreshed every 24 hours.
- In the sandbox: an **HTTP API streaming connection (inlet)** with its **dataflow** (its ID is the required `flowId`), an **XDM schema** and a **dataset** for ExperienceEvents. A second schema and dataset are needed to test `upsertProfile`.

**What depends on live AEP access (cannot be verified with mocks)**
- Whether the Bearer token is needed on authenticated vs unauthenticated inlets, and how the customer enables it (Q10).
- OAuth scopes and the token endpoint (Q10).
- Schema conformance and what AEP drops silently, real 207 per-message results, 413/429 behavior and actual throttling limits.
- Whether `flowId` and the `x-sandbox-name` header are actually enforced (Adobe's reference spec requires them; its tutorial example omits both).
- Schema Registry introspection (Q11) and the token-only `testAuthentication` against real credentials.
- Late/future timestamp handling (Q8).

**What can proceed without it**
- Action definitions, field schemas, envelope and `identityMap`/nested XDM JSON building, byte-bounded batching and 207 per-message error handling, all tested with `nock` using fixtures built from Adobe's documented request/response examples.

**Customer-side requirement:** each customer needs the same setup in their own AEP org (licensed AEP, Developer Console project with OAuth Server-to-Server credentials, streaming connection, schema and dataset) before they can use the destination.

**Action needed:** obtain an AEP-enabled org or sandbox (internal, via Adobe partner contact, or a cooperating customer) before integration testing and any beta release.

---

## 6. Open Questions

### Resolved by Adobe docs
- **Q1 (endpoint): resolved.** `POST https://dcs.adobedc.net/collection/batch/{CONNECTION_ID}`. The connection ID is the customer's inlet ID, so `inletId` is a customer-supplied action field.
- **Q3 (schemaRef / datasetId source): resolved.** Both are required in each message header, along with `imsOrgId` and `flowId`. Modeled as action-level fields.
- **`flowId` (previously missing from this blueprint): resolved by Adobe's reference spec.** It is required in the message `header` (with `schemaRef`, `imsOrgId`, `datasetId`) and is the ID of the dataflow; added as a required action-level field on both actions, plus optional `source.name`. Whether Adobe really enforces it, and where it is best modeled, remain open (Q12, Q15).
- **Q11 `sandboxName` half: resolved.** `x-sandbox-name` is a required header on both ingestion operations, so `sandboxName` is a required action field sent on every request.
- **Earlier open item "`operations` header field": not in the reference spec.** The message header has `schemaRef`, `imsOrgId`, `datasetId`, `createdAt` (auto-generated), `flowId` and optional `source`; no `operations` field is documented, so it is dropped.
- **Auth necessity (earlier open question): resolved in part.** 401/403 occur only for inlets with authentication enabled, so the OAuth token is needed only for authenticated inlets (Q10 remains for how this affects settings).

### Resolved by repo research (`repo-research-findings.md`)
- **Multi-status handling: resolved.** `performBatch` must return a `MultiStatusResponse`, or Adobe's 207 failures are silently treated as success (see `sendEvent` considerations).
- **Q10 OAuth scheme: resolved.** `oauth2` with a custom `refreshAccessToken` (`client_credentials`), not `oauth-managed`; map Adobe 403 to 401 so core's built-in refresh fires. Token URL is probably `https://ims-na1.adobelogin.com/ims/token/v3`; scope and auth-optional behavior remain open.
- **Q6 nested JSON/UI (second half): resolved.** Key-value object field plus a destination-owned dotted-path helper with collision and prototype-key guards. The schema choice (lift-and-shift vs clean semantic) is still a product decision.
- **Batching design: resolved.** Hidden `batch_bytes` with headroom, plus a per-message oversize guard.
- **Q11 (partly):** dynamic fields give schema pickers but not per-key autocomplete, so P0 is manual path entry and introspection is P1. The UI-team ask remains.
- **Q13 (mostly):** retryable status set known and a per-message mapping proposed; the owner of per-entry multi-status retry remains. The 500 decision is made: a schema mismatch is assumed to be a 400, so 500 is retried as transient.
- **Q12 (decision):** settings are only `clientId` and `clientSecret`; `imsOrgId`, `sandboxName`, `inletId`, `schemaRefId`, `schemaRefContentType`, `datasetId` and `flowId` are action fields. `testAuthentication` checks the credentials only. Whether a flow is one-to-one with an inlet remains in Q15.

### Still open
From the PRD:
- **Q2: Profile enrichment path.** Per-event enrichment vs CJA query-time join (separate Profile Dataset). Decides whether `upsertProfile` ships. PRD recommends the join; Sean Han's comment assumes JPMC keeps insert-function enrichment plus Linked Events. Deciding factor: point-in-time vs current trait values in JPMC's reports.
- **Q6: XDM schema approach.** Lift-and-shift via the Analytics ExperienceEvent Full Extension vs a clean semantic schema (customer decision; both work through `xdmMapping`). For JPMC about 82% of mappings are lift-and-shift and 18% semantic (Sean Han). Nested JSON UI support is resolved above.
- **Q7: Identity namespace / cross-device stitching.** Is ECI-based stitching actively used? If so the ECI namespace must be configured in AEP Identity Service and mapped via `identityMap`. Namespaces can be introspected via `data/core/idnamespace/identities` (Sean Han), a P1 dropdown candidate.
- **Q8: Out-of-order timestamps.** Narrowed: Sean Han reports no AEP restrictions and no blocking in the JPMC POC; Adobe's class page says `timestamp` must be in the past. Confirm future-timestamp behavior live.
- **Q16: Lift-and-Shift toggle.** Manual mapping to eVar/prop paths already works; the toggle only automates the property-to-eVar table. If events already carry eVar/prop-named fields (BDIA CSV columns are AA variables), auto-routing them is small and in-repo; if the table lives in legacy AA destination settings, a BDIA job or an insert function, importing it is control-plane work outside this repo. Check JPMC's mapping file. Varadarajan Vijayaragavan flagged it as "a big ask". PRD fallback: setup warning plus a BDIA to AEP migration guide.
- **Q17: Linked Events support** (Sean Han). Confirm what the destination must do to be enabled.
- **Q18: Schema prerequisites.** ExperienceEvent class plus Identity Map field group for v1. Confirm what AEP does when `identityMap` is sent to a schema without the field group, and whether identity-field-only schemas need support later.
- **Q19: eVar/prop value types.** Stringify non-string values mapped to `_experience.analytics.customDimensions.*`, or send as mapped?
- Customer list (Sean Han): scan workspaces for active classic Adobe Analytics destinations (IBM also needs AEP). JPMC's legacy path is BDIA (CSV), not the classic destination's Data Insertion API (XML), so its eVar mapping may not be in the classic destination settings (Q16).
- Throughput entitlements: see Q14.

Found while refining:
- **Q4: resolved (Adobe docs).** Same batch endpoint and envelope: the batch format is "identical" to the single-message endpoint, the record-data tutorial streams profile records with the same header, and one request may target "the same or different datasets and schemas". The profile dataset must be Profile- and Identity-enabled.
- **Q5: resolved (decision).** Drop blank identities; exactly one primary (custom flagged, else PID, else first custom, else ECID); no valid identity means the event is rejected with a 400 `PAYLOAD_VALIDATION_FAILED` and is not retried. Adobe's streaming docs do not state these rules, so confirm in a live org.
- **Q9: resolved (Adobe docs).** The ExperienceEvent class requires `_id` (sender-generated: hash of `messageId`) and `timestamp` (past, from 1970). The `msgType`/`msgId`/`xdmSchema` form is only the invalid example message in Adobe's tutorial, so it is not supported.
- **Q10:** OAuth token URL is probably `https://ims-na1.adobelogin.com/ims/token/v3` (Developer Console guide); the AEP `scope` value is still undocumented. Are `clientId`/`clientSecret` optional when the inlet is unauthenticated? If so mark them `required: false` and make sure `extendRequest` doesn't send a bad header. (Scheme is resolved: `oauth2` + `refreshAccessToken`.) Which header carries the Client ID (`x-api-key`)?
- **Q11:** Plan is manual path entry in P0 and introspection in P1 (schema picker; per-key autocomplete would be a UI-team ask). The `sandboxName` half is resolved: it is a required ingestion header.
- **Q12: resolved (decision).** Org ID, sandbox and inlet are action fields; settings are only `clientId` and `clientSecret` (see above). Q15 still covers `flowId` versus inlet.
- **Q15:** `flowId`: how does a customer find it, is it enforced in practice (Adobe's tutorial example omits it), and is a flow tied one-to-one to an inlet (making it an inlet-level setting rather than an action field)? Adobe describes it only as "the ID of the dataflow... when the account has been used to create multiple dataflows".
- **Q13:** Which platform component retries individual multi-status entries (outside this repo; confirm with the platform team)? Decision made: a schema mismatch is assumed to be a 400 (not retried) and 500 is retried as transient; verify the real status for a mismatch in a live org (Adobe's tutorial lists 500 for schema problems, its OpenAPI spec calls 500 an internal error).
- **Q14:** Throughput conflict in Section 4 (10,000 messages/sec vs the 25-30k events/sec target).
- The reference spec was read from Adobe's docs repo. It is a static file and may lag the live reference page, so re-check `flowId` and the headers against the rendered API reference when AEP access is available.
- Group and Alias are not covered by the PRD (events and profile only).

---

## Sources

- [Send multiple messages in a single HTTP request](https://experienceleague.adobe.com/en/docs/experience-platform/ingestion/tutorials/streaming-multiple-messages)
- [Streaming ingestion overview](https://experienceleague.adobe.com/en/docs/experience-platform/ingestion/streaming/overview)
- [Create an HTTP API streaming connection using the Flow Service API](https://experienceleague.adobe.com/en/docs/experience-platform/sources/api-tutorials/create/streaming/http)
- [Authenticate and access Experience Platform APIs](https://experienceleague.adobe.com/en/docs/experience-platform/landing/platform-apis/api-authentication)
- [Adobe streaming ingestion OpenAPI spec](https://github.com/AdobeDocs/experience-platform-apis/blob/main/static/swagger-specs/streaming-ingestion.yaml) (the source for `flowId`, `x-sandbox-name`, `syncValidation` and the schema definitions; the rendered reference is [developer.adobe.com](https://developer.adobe.com/experience-platform-apis/references/streaming-ingestion))
- `repo-research-findings.md` (same folder): repo-side research by a peer Claude session (`action-destinations-e5`) covering `MultiStatusResponse`, OAuth, retry classification, nested paths, dynamic fields and batching. Its code references (e.g. `core/src/destination-kit/action.ts`, `core/src/errors.ts:28`) were not independently re-checked here.
- [Community: discovering the inletId](https://experienceleaguecommunities.adobe.com/t5/journey-optimizer-questions/discover-inletid-for-profile-automating-update/td-p/789580) (non-official)
- [Basics of schema composition](https://experienceleague.adobe.com/en/docs/experience-platform/xdm/schema/composition), [XDM Individual Profile class](https://experienceleague.adobe.com/en/docs/experience-platform/xdm/classes/individual-profile), [Identity Map field group](https://experienceleague.adobe.com/en/docs/experience-platform/xdm/field-groups/profile/identitymap), [defining identity fields](https://experienceleague.adobe.com/en/docs/experience-platform/xdm/ui/fields/identity)
- [Adobe Analytics ExperienceEvent Full Extension field group](https://experienceleague.adobe.com/en/docs/experience-platform/xdm/field-groups/event/analytics-full-extension), [Analytics variable mapping in XDM](https://experienceleague.adobe.com/en/docs/analytics/implementation/aep-edge/xdm-var-mapping), [Analytics source connector field mapping](https://experienceleague.adobe.com/en/docs/experience-platform/sources/connectors/adobe-applications/mapping/analytics)
- [Segment: Adobe Analytics destination](https://www.twilio.com/docs/segment/connections/destinations/catalog/adobe-analytics), [Bulk Data Insertion API](https://developer.adobe.com/analytics-collection-apis/methods/bulk-data-insertion/)
