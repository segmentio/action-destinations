// ---------- Adobe IMS ----------

export interface ImsTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

// ---------- XDM message envelope ----------

export interface SchemaRef {
  id: string
  contentType: string
}

// Type aliases (not interfaces) so these stay assignable to the XdmObject index signature.
export type IdentityEntry = {
  id: string
  primary: boolean
}

export type IdentityMap = Record<string, IdentityEntry[]>

export interface XdmObject {
  [key: string]: XdmValue
}

export type XdmValue = string | number | boolean | null | XdmObject | XdmValue[]

export type XdmEntity = XdmObject & {
  identityMap: IdentityMap
}

export interface StreamingMessageHeader {
  schemaRef: SchemaRef
  imsOrgId: string
  datasetId: string
  flowId: string
  source?: { name: string }
}

export interface StreamingMessageBody {
  xdmMeta: { schemaRef: SchemaRef }
  xdmEntity: XdmEntity
}

export interface StreamingMessage {
  header: StreamingMessageHeader
  body: StreamingMessageBody
}

// POST /collection/batch/{CONNECTION_ID}
export interface BatchStreamingRequest {
  messages: StreamingMessage[]
}

// ---------- Responses ----------

// One entry per message, index-matched to `messages[]`.
// The spec documents only `xactionId`; `statusCode` / `message` on failed entries come from Adobe's tutorial.
// TODO: confirm the failed-entry shape against a real 207 from a live org.
export interface BatchResponseEntry {
  xactionId?: string
  statusCode?: number
  message?: string
}

export interface BatchStreamingResponse {
  inletId?: string
  batchId?: string
  receivedTimeMs?: number
  responses?: BatchResponseEntry[]
}

// Request-level error body. Adobe uses several shapes across services; all fields are optional.
export interface AdobeErrorResponse {
  type?: string
  status?: number
  title?: string
  detail?: string
  message?: string
  report?: { message?: string }
}

// ---------- Internal ----------

export type MessageKind = 'event' | 'profile'

// Outcome for one payload, before conversion to a MultiStatusResponse entry or a thrown error.
export type DeliveryResult =
  | { ok: true; sent: StreamingMessage; body: BatchResponseEntry | BatchStreamingResponse }
  | { ok: false; status: number; message: string; local: boolean; sent?: StreamingMessage; body?: unknown }
