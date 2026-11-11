# Endpoint Mapping: Adobe AEP (Customer Journey Analytics)

Generated: 2026-11-10

Inputs: `refined-actions.md` (action list, updated 2026-11-10; `batch_size` from `design-spec.md` 3.3.4) and Adobe's streaming ingestion OpenAPI spec (`streaming-ingestion.yaml`, OpenAPI 3.0.1, `info.version` 1.0, from `AdobeDocs/experience-platform-apis`, read 2026-11-10). Behavior the spec does not document is marked with its source (Adobe tutorial, design decision, or unverified).

---

## API Overview

- **Base URL:** `https://dcs.adobedc.net/`
- **API Version:** 1.0 (spec `info.version`)
- **Auth:** `Authorization: Bearer {token}`, "only required for inlets whose clients have enabled Authorization" (spec). The token comes from Adobe IMS OAuth server-to-server (`client_credentials`), which is outside this spec: `POST https://ims-na1.adobelogin.com/ims/token/v3` (Developer Console guide; scope still open, Q10).
- **Total Endpoints in Spec:** 2 (`sendMessage`, `postBatchOfStreamingMessages`)
- **Total Actions Mapped:** 2
- **Direct Matches:** 2
- **Gap Reconciliations:** 0 (no endpoint gaps; field-level open items listed per action)

**Spec endpoints:**

| operationId | Method | Path | Body | Success |
|---|---|---|---|---|
| `sendMessage` | POST | `/collection/{CONNECTION_ID}` | `streamingMessage` (one `{header, body}`) | 200 `StreamingIngestionResponse` (`inletID`, `xactionId`, `receivedTimeMs`) |
| `postBatchOfStreamingMessages` | POST | `/collection/batch/{CONNECTION_ID}` | `BatchMessage` (`{ messages: [ {header, body} ] }`) | 207 `BatchResponseDTO` (`inletId`, `batchId`, `receivedTimeMs`, `responses[]`) |

Both declare 400, 401, 403, 413 ("larger than 1 MB"), 429, 500 and 503 ("retry at least three times using an exponential back-off", `Retry-After` header). Required headers on both: `x-sandbox-name`, `Content-Type` (`application/json` or `application/x-jackson-smile`). `syncValidation` (query, max 60 requests/min per connection) exists only on `sendMessage`.

**Endpoints used but outside this spec** (not counted above): the IMS token endpoint (auth) and the Schema Registry (`GET https://platform.adobe.io/data/foundation/schemaregistry/tenant/schemas`, P1 schema picker, design-spec 3.3.2).

---

## Action Mappings

### Action: Send Event (`send-event`)

**API Operation:** `postBatchOfStreamingMessages` — `POST`
**Endpoint URI:** `https://dcs.adobedc.net/collection/batch/{CONNECTION_ID}`

**Batch Endpoint:** `postBatchOfStreamingMessages` — `POST` `/collection/batch/{CONNECTION_ID}` — records-per-request limit: undocumented as a count (1 MB per request, HTTP 413; Adobe's tutorial example sends 200 x 1 KB messages); array wrapper key: `messages`. **Preferred delivery path; backs `performBatch`.**

**Single endpoint:** `sendMessage` — `POST /collection/{CONNECTION_ID}` (same message format; the spec says the batch body is "identical"). Recommendation: `perform` also posts a one-message array to the batch endpoint, so both paths share the 207 parsing and status mapping. `sendMessage` is a fallback only.

- **Trigger / default subscription:** `type = "track" or type = "page" or type = "screen"`
- **Schema prerequisites (Q18):** ExperienceEvent class and Identity Map field group; the Adobe Analytics ExperienceEvent Full Extension field group if eVar/prop paths are mapped.

#### Field Mapping Table

Paths are relative to one element of `messages[]`.

| Source Field | Segment Path | Target Field (API) | Target Type | Transform | Required by API |
|---|---|---|---|---|---|
| `inletId` | user-entered | path `{CONNECTION_ID}` | string | Direct | Yes |
| `sandboxName` | user-entered | header `x-sandbox-name` | string | Direct | Yes |
| `imsOrgId` | user-entered | `header.imsOrgId` | string | Direct | Yes |
| `schemaRefId` | user-entered | `header.schemaRef.id` | string | Nest | Yes |
| `schemaRefId` | user-entered | `body.xdmMeta.schemaRef.id` | string | Nest (same value as header, must match) | Yes |
| `schemaRefContentType` | user-entered | `header.schemaRef.contentType` | string | Nest | Yes |
| `schemaRefContentType` | user-entered | `body.xdmMeta.schemaRef.contentType` | string | Nest (same value as header) | Yes |
| `datasetId` | user-entered | `header.datasetId` | string | Direct | Yes |
| `flowId` | user-entered | `header.flowId` | string | Direct | Yes (spec; tutorial omits it, Q15) |
| `sourceName` | user-entered | `header.source.name` | string | Nest | No (Adobe fills the source ID) |
| `eventId` | `$.messageId` | `body.xdmEntity._id` | string | Hash (SHA-256 hex) | Yes (ExperienceEvent class, not this spec) |
| `timestamp` | `$.timestamp` | `body.xdmEntity.timestamp` | string (ISO 8601) | Format (ISO 8601 / RFC 3339) | Yes (ExperienceEvent class) |
| `ecid` | `$.anonymousId` | `body.xdmEntity.identityMap.ECID[0].{id, primary}` | object array | Conditional + Nest (Q5: drop blank; primary only if no PID or custom identity) | No* |
| `pid` | `$.userId` | `body.xdmEntity.identityMap.PID[0].{id, primary}` | object array | Conditional + Nest (Q5: primary by default) | No* |
| `customIdentities` | user-mapped array of `{namespace, value, primary?}` | `body.xdmEntity.identityMap.<namespace>[].{id, primary}` | object array | Enumerate + Conditional (group by namespace; drop blank; one primary) | No* |
| `xdmMapping` | user-mapped key-value (e.g. `$.properties.*`) | `body.xdmEntity.<dotted path>` | object | Nest (`setPath` on dots; reject `__proto__`, `constructor`, `prototype`; collision rule) | Depends on schema |
| `xdmMapping` (lift-and-shift keys) | user-mapped | `body.xdmEntity._experience.analytics.customDimensions.eVars.eVarN` / `.props.propN` | string | Nest (+ Type Cast to string if Q19 decides so) | No |
| `enable_batching` | n/a | n/a (platform batching) | boolean | Direct | n/a |
| `batch_size` | n/a | n/a (platform batching; default 100, range 10-250, design-spec 3.3.4) | number | Direct | n/a |
| `batch_bytes` | n/a | n/a (hidden; default 800000, under the 1 MB 413 limit) | number | Direct | n/a |
| `batch_keys` | n/a | n/a (hidden; `['imsOrgId','sandboxName','inletId']`) | string[] | Direct | n/a |

\* At least one valid identity is required by design (Q5), not by the spec. An event with none is rejected locally (see Response Handling).

#### Mandatory API Parameters (not in action fields)

| Parameter | Location | Source | Value |
|---|---|---|---|
| `Content-Type` | header | hardcoded | `application/json` |
| `Authorization` | header | derived (`extendRequest`, OAuth token from `clientId` + `clientSecret`) | `Bearer {access_token}`; only needed for authenticated inlets |
| `x-api-key` | header | settings | `settings.clientId`. **Not in this spec**; sent per the blueprint (Q10 asks whether it is needed for ingestion) |
| `messages` | body | derived | one entry per payload in the batch |
| `header.createdAt` | body | not sent | Spec: "automatically generated"; absent from the batch item schema |

All spec-required parameters (`CONNECTION_ID`, `x-sandbox-name`, `Content-Type`, `header.schemaRef`, `header.imsOrgId`, `header.datasetId`, `header.flowId`, `body.xdmMeta.schemaRef`, `body.xdmEntity`) are covered.

#### Response Handling

- **Success (207):** `BatchResponseDTO.responses[i]` lines up with `messages[i]`. An entry with `xactionId` means success: call `setSuccessResponseAtIndex(i, { status: 200, sent, body })` and keep `xactionId` for debugging. `performBatch` must return a `MultiStatusResponse`.
- **Per-message failure (in the 207):** the spec's `BatchResponseMessage` lists only `xactionId`. The failed entry's `statusCode` and `message` come from Adobe's tutorial, so capture a real one in a live org. Map each entry: 400 → error, not retried; 401 → error 401 (core refreshes the token and retries); **403 → report as 401** so the refresh runs; 413 → error, not retried; 429, 500, 503 → retried.
- **Rejected before sending (Q5):** an event with no valid identity gets `setErrorResponseAtIndex(i, { status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED', ... })` and is left out of the request. If every event is rejected, no HTTP call is made. `perform` throws `PayloadValidationError`.
- **Request-level error (non-207):** 400, 401, 403, 413, 429, 500 or 503 for the whole request fails every message in the batch with that status. Same retry classes as above (core's retryable set: 408, 423, 429, 500, 502-511, 598, 599). 503 includes `Retry-After`.
- **Single message over 1 MB:** reported as a 413 at its index without sending, so the rest of the batch still goes.

---

### Action: Upsert Profile (`upsert-profile`)

**API Operation:** `postBatchOfStreamingMessages` — `POST`
**Endpoint URI:** `https://dcs.adobedc.net/collection/batch/{CONNECTION_ID}`

**Batch Endpoint:** `postBatchOfStreamingMessages` — `POST` `/collection/batch/{CONNECTION_ID}` — records-per-request limit: undocumented as a count (1 MB per request); array wrapper key: `messages`. **Preferred delivery path; backs `performBatch`.** Profile records use the same envelope (Q4: the spec says the batch format is "identical" to the single endpoint, and Adobe's streaming-record-data tutorial streams profile records with the same header).

**Single endpoint:** `sendMessage` — `POST /collection/{CONNECTION_ID}` (fallback only; same recommendation as Send Event).

- **Trigger / default subscription:** `type = "identify"`
- **Priority:** P0 in the PRD, but only if JPMC picks the CJA query-time join (Q2).
- **Schema prerequisites:** Individual Profile class and Identity Map field group; dataset enabled for Profile and Identity Service. Adobe's class page doesn't state required fields; confirm with a live schema.

#### Field Mapping Table

| Source Field | Segment Path | Target Field (API) | Target Type | Transform | Required by API |
|---|---|---|---|---|---|
| `inletId` | user-entered | path `{CONNECTION_ID}` | string | Direct | Yes |
| `sandboxName` | user-entered | header `x-sandbox-name` | string | Direct | Yes |
| `imsOrgId` | user-entered | `header.imsOrgId` | string | Direct | Yes |
| `schemaRefId` | user-entered (Individual Profile schema) | `header.schemaRef.id` and `body.xdmMeta.schemaRef.id` | string | Nest (same value in both places) | Yes |
| `schemaRefContentType` | user-entered | `header.schemaRef.contentType` and `body.xdmMeta.schemaRef.contentType` | string | Nest (same value in both places) | Yes |
| `datasetId` | user-entered (profile dataset) | `header.datasetId` | string | Direct | Yes |
| `flowId` | user-entered | `header.flowId` | string | Direct | Yes (spec) |
| `ecid` | `$.anonymousId` | `body.xdmEntity.identityMap.ECID[0].{id, primary}` | object array | Conditional + Nest (Q5) | No* |
| `pid` | `$.userId` | `body.xdmEntity.identityMap.PID[0].{id, primary}` | object array | Conditional + Nest (Q5). Must match Send Event's PID so the CJA join on Person ID works | No* |
| `customIdentities` | user-mapped | `body.xdmEntity.identityMap.<namespace>[].{id, primary}` | object array | Enumerate + Conditional | No* |
| `xdmMapping` | user-mapped (`$.traits.*`) | `body.xdmEntity.<dotted path>` (Individual Profile paths) | object | Nest (`setPath`, same guards) | Depends on schema |
| `enable_batching` / `batch_size` / `batch_bytes` / `batch_keys` | n/a | n/a (platform batching; same defaults and keys as Send Event) | — | Direct | n/a |

\* Same Q5 identity rules as Send Event. Profile needs a primary identity (Adobe: a schema enabled for Profile must define one).

Not sent: `_id` and `timestamp`. They aren't required for the record class, and `refined-actions.md` doesn't list them. `sourceName` isn't in `refined-actions.md` for this action, so `header.source.name` is omitted and Adobe fills it.

#### Mandatory API Parameters (not in action fields)

| Parameter | Location | Source | Value |
|---|---|---|---|
| `Content-Type` | header | hardcoded | `application/json` |
| `Authorization` | header | derived (`extendRequest`) | `Bearer {access_token}` (authenticated inlets) |
| `x-api-key` | header | settings | `settings.clientId` (not in this spec; Q10) |
| `messages` | body | derived | one entry per payload |

#### Response Handling

- **Success (207):** same as Send Event: index-matched `responses[i].xactionId` → `setSuccessResponseAtIndex`. Return a `MultiStatusResponse`.
- **Errors:** same per-message and request-level mapping as Send Event (403 → 401, 429/500/503 retried, 400/413 not). Local Q5 rejection applies too.

---

## Gap Reconciliations

No endpoint gaps. Both actions map directly to `postBatchOfStreamingMessages`. Open items, none of which drops an action:

| Item | Affects | Notes |
|---|---|---|
| Per-message error shape | both | `statusCode` and `message` on failed `responses[]` entries come from Adobe's tutorial, not the spec. Capture a real 207 in a live org. |
| `x-api-key` header | both | Sent per the blueprint; absent from the ingestion spec (Q10). |
| `flowId` enforcement | both | Required in the spec, omitted in the tutorial (Q15). |
| Records-per-request limit | both | Only the 1 MB limit is documented. Rate limits (1,000 requests/sec, 10,000 messages/sec) come from the streaming overview page, not this spec (Q14). |
| Lift-and-shift toggle | sendEvent | Fixed `_experience.analytics` paths work through `xdmMapping`. The automatic toggle needs a property-to-eVar table whose source is unknown (Q16); arrays (`lists`, `listProps`, `productListItems`) need code. |
| Profile record required fields | upsertProfile | Not stated on Adobe's Individual Profile class page. |

---

## Coverage Summary

| Action | Endpoint Match | Match Type | Gaps |
|---|---|---|---|
| `sendEvent` | `POST /collection/batch/{CONNECTION_ID}` (`postBatchOfStreamingMessages`); single: `POST /collection/{CONNECTION_ID}` | Direct (operationId + semantic) | None at endpoint level; field-level open items above |
| `upsertProfile` | `POST /collection/batch/{CONNECTION_ID}` (`postBatchOfStreamingMessages`); single: `POST /collection/{CONNECTION_ID}` | Direct (semantic; same endpoint with Individual Profile schema) | None at endpoint level; conditional on Q2 |
