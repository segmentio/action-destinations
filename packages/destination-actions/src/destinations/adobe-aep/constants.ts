// Adobe Experience Platform streaming ingestion (Data Collection Core Service).
export const DCS_BASE_URL = 'https://dcs.adobedc.net'

// Single-message endpoint (`sendMessage`). Not used for delivery; kept for reference and manual debugging.
export const singleMessageUrl = (inletId: string) => `${DCS_BASE_URL}/collection/${encodeURIComponent(inletId)}`

// Batch endpoint (`postBatchOfStreamingMessages`). Backs both perform (batch of one) and performBatch.
export const batchMessagesUrl = (inletId: string) => `${DCS_BASE_URL}/collection/batch/${encodeURIComponent(inletId)}`

// Adobe IMS OAuth server-to-server token endpoint.
export const IMS_TOKEN_URL = 'https://ims-na1.adobelogin.com/ims/token/v3'

// TODO(Q10): confirm the scope set with Adobe. These are the scopes Adobe Developer Console assigns to an
// OAuth server-to-server credential for the Experience Platform API.
export const IMS_SCOPE = 'openid,AdobeID,read_organizations,additional_info.projectedProductContext,session'

// Header required on every streaming request.
export const SANDBOX_HEADER = 'x-sandbox-name'

// Default XDM schema content type.
export const DEFAULT_SCHEMA_CONTENT_TYPE = 'application/vnd.adobe.xed-full+json;version=1'

// Identity namespaces populated from the dedicated identity fields (Q5).
export const ECID_NAMESPACE = 'ECID'
export const PID_NAMESPACE = 'PID'

// Adobe rejects requests (and single messages) over 1 MB with HTTP 413.
export const MAX_REQUEST_BYTES = 1_000_000

// Batching defaults (spec: Send Event / Upsert Profile batching).
export const DEFAULT_BATCH_SIZE = 100
export const MIN_BATCH_SIZE = 10
export const MAX_BATCH_SIZE = 250
// Keeps a full batch, plus the `{ "messages": [] }` wrapper, under the 1 MB request limit.
export const DEFAULT_BATCH_BYTES = 800_000

// Keys that must never be used as XDM path segments (prototype pollution guard).
export const FORBIDDEN_PATH_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype'])
