import {
  APIError,
  ErrorCodes,
  InvalidAuthenticationError,
  MultiStatusResponse,
  PayloadValidationError
} from '@segment/actions-core'
import { processHashing } from '../../lib/hashing-utils'
import type { JSONLikeObject, ModifiedResponse, RequestClient } from '@segment/actions-core'
import {
  batchMessagesUrl,
  ECID_NAMESPACE,
  FORBIDDEN_PATH_SEGMENTS,
  IMS_SCOPE,
  IMS_TOKEN_URL,
  MAX_REQUEST_BYTES,
  PID_NAMESPACE,
  SANDBOX_HEADER
} from './constants'
import type {
  AdobeErrorResponse,
  BatchStreamingRequest,
  BatchStreamingResponse,
  DeliveryResult,
  IdentityMap,
  ImsTokenResponse,
  MessageKind,
  StreamingMessage,
  StreamingMessageHeader,
  XdmEntity,
  XdmObject,
  XdmValue
} from './types'

// Fields both actions' generated Payload types satisfy. Event-only fields are optional here.
export interface AepPayload {
  imsOrgId: string
  sandboxName: string
  inletId: string
  schemaRefId: string
  schemaRefContentType: string
  datasetId: string
  flowId: string
  sourceName?: string
  eventId?: string
  timestamp?: string | number
  ecid?: string
  pid?: string
  customIdentities?: { namespace: string; value: string; primary?: boolean }[]
  xdmMapping?: { [k: string]: unknown }
}

// ---------- Auth ----------

export async function getAccessToken(request: RequestClient, clientId: string, clientSecret: string): Promise<string> {
  const response = await request<ImsTokenResponse>(IMS_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: IMS_SCOPE
    })
  })
  return response.data.access_token
}

// ---------- XDM building ----------

const isPlainObject = (value: unknown): value is XdmObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isBlank = (value: unknown): boolean =>
  value === undefined || value === null || (typeof value === 'string' && value.trim() === '')

function splitPath(path: string): string[] {
  const segments = path.split('.').map((s) => s.trim())
  if (segments.some((s) => s === '')) {
    throw new PayloadValidationError(`XDM path "${path}" is not valid: it has an empty segment.`)
  }
  if (segments.some((s) => FORBIDDEN_PATH_SEGMENTS.has(s))) {
    throw new PayloadValidationError(`XDM path "${path}" is not allowed.`)
  }
  return segments
}

/**
 * Writes `value` at a dotted XDM `path`, creating nested objects as needed.
 * Undefined and null values are skipped. Mapping both `a` and `a.b` is a conflict and is rejected,
 * so a later key never silently overwrites an earlier one.
 */
export function setPath(target: XdmObject, path: string, value: unknown): void {
  if (value === undefined || value === null) return
  const segments = splitPath(path)
  let node: XdmObject = target
  for (let i = 0; i < segments.length - 1; i++) {
    const key = segments[i]
    const existing = Object.prototype.hasOwnProperty.call(node, key) ? node[key] : undefined
    if (existing === undefined) {
      const child: XdmObject = {}
      node[key] = child
      node = child
    } else if (isPlainObject(existing)) {
      node = existing
    } else {
      throw new PayloadValidationError(`XDM path "${path}" conflicts with another mapped path.`)
    }
  }
  const leaf = segments[segments.length - 1]
  if (Object.prototype.hasOwnProperty.call(node, leaf)) {
    throw new PayloadValidationError(`XDM path "${path}" conflicts with another mapped path.`)
  }
  node[leaf] = value as XdmValue
}

/**
 * Builds `identityMap` (spec: Q5 decision).
 * 1. Blank identities are dropped; namespaces left empty are omitted.
 * 2. Exactly one primary: first custom identity flagged primary, else PID, else first custom identity, else ECID.
 * 3. No identity at all rejects the event.
 */
export function buildIdentityMap(payload: AepPayload): IdentityMap {
  type Candidate = { namespace: string; id: string; flagged: boolean }
  const custom: Candidate[] = []
  for (const entry of payload.customIdentities ?? []) {
    if (isBlank(entry?.namespace) || isBlank(entry?.value)) continue
    const namespace = String(entry.namespace).trim()
    if (FORBIDDEN_PATH_SEGMENTS.has(namespace)) {
      throw new PayloadValidationError(`Identity namespace "${namespace}" is not allowed.`)
    }
    custom.push({ namespace, id: String(entry.value).trim(), flagged: entry.primary === true })
  }
  const pid: Candidate | undefined = isBlank(payload.pid)
    ? undefined
    : { namespace: PID_NAMESPACE, id: String(payload.pid).trim(), flagged: false }
  const ecid: Candidate | undefined = isBlank(payload.ecid)
    ? undefined
    : { namespace: ECID_NAMESPACE, id: String(payload.ecid).trim(), flagged: false }

  // Order: custom identities, PID, ECID. Duplicates (same namespace and id) keep the first occurrence.
  const all: Candidate[] = []
  for (const candidate of [...custom, pid, ecid]) {
    if (!candidate) continue
    const duplicate = all.find((c) => c.namespace === candidate.namespace && c.id === candidate.id)
    if (duplicate) {
      duplicate.flagged = duplicate.flagged || candidate.flagged
    } else {
      all.push({ ...candidate })
    }
  }

  if (all.length === 0) {
    throw new PayloadValidationError(
      'The event has no identity. Map at least one of ECID, PID or a custom identity with a non-empty value.'
    )
  }

  const flaggedCustom = all.find((c) => c.flagged)
  const primary =
    flaggedCustom ??
    all.find((c) => c.namespace === PID_NAMESPACE && pid && c.id === pid.id) ??
    all.find((c) => custom.some((k) => k.namespace === c.namespace && k.id === c.id)) ??
    all[0]

  const identityMap: IdentityMap = {}
  for (const candidate of all) {
    const entries = identityMap[candidate.namespace] ?? (identityMap[candidate.namespace] = [])
    entries.push({ id: candidate.id, primary: candidate === primary })
  }
  return identityMap
}

// `_id` must not contain `/ \ ? #` and must be under 1,023 bytes; a SHA-256 hex digest satisfies both
// and is stable, so retries of the same Segment message carry the same `_id`. A value that is already a
// SHA-256 hex digest is passed through unchanged.
export function hashEventId(eventId: string): string {
  return processHashing(eventId, 'sha256', 'hex')
}

export function formatTimestamp(timestamp: string | number): string {
  const date = new Date(timestamp)
  if (isNaN(date.getTime())) {
    throw new PayloadValidationError(`Timestamp "${timestamp}" is not a valid date.`)
  }
  return date.toISOString()
}

const RESERVED_KEYS: Record<MessageKind, string[]> = {
  event: ['_id', 'timestamp', 'identityMap'],
  profile: ['identityMap']
}

export function buildMessage(payload: AepPayload, kind: MessageKind): StreamingMessage {
  const mapped: XdmObject = {}
  for (const [path, value] of Object.entries(payload.xdmMapping ?? {})) {
    const root = splitPath(path)[0]
    if (RESERVED_KEYS[kind].includes(root)) {
      throw new PayloadValidationError(
        `XDM path "${path}" can't be used in XDM Mapping: "${root}" is set by this action's dedicated fields.`
      )
    }
    setPath(mapped, path, value)
  }

  const identityMap = buildIdentityMap(payload)
  let xdmEntity: XdmEntity
  if (kind === 'event') {
    if (isBlank(payload.eventId)) {
      throw new PayloadValidationError('Event ID is required.')
    }
    if (isBlank(payload.timestamp)) {
      throw new PayloadValidationError('Timestamp is required.')
    }
    xdmEntity = {
      _id: hashEventId(String(payload.eventId)),
      timestamp: formatTimestamp(payload.timestamp as string | number),
      identityMap,
      ...mapped
    }
  } else {
    xdmEntity = { identityMap, ...mapped }
  }

  const schemaRef = { id: payload.schemaRefId, contentType: payload.schemaRefContentType }
  const header: StreamingMessageHeader = {
    schemaRef,
    imsOrgId: payload.imsOrgId,
    datasetId: payload.datasetId,
    flowId: payload.flowId
  }
  if (kind === 'event' && !isBlank(payload.sourceName)) {
    header.source = { name: String(payload.sourceName) }
  }

  return { header, body: { xdmMeta: { schemaRef: { ...schemaRef } }, xdmEntity } }
}

// ---------- Delivery ----------

// Adobe returns 403 for an invalid or expired token. Core only refreshes OAuth tokens on 401.
export function normalizeStatus(status: number): number {
  return status === 403 ? 401 : status
}

function describeError(status: number, data: unknown, content: string | undefined): string {
  const body = (isPlainObject(data) ? data : {}) as AdobeErrorResponse
  const detail =
    body.detail ?? body.message ?? body.report?.message ?? body.title ?? (content ? content.slice(0, 300) : undefined)
  let message = `Adobe Experience Platform returned ${status}${detail ? `: ${detail}` : ''}`
  if (status === 401 || status === 403) {
    message +=
      '. The access token may be invalid or expired, or the IMS Organization ID or sandbox may not match the streaming connection.'
  }
  return message
}

interface Group {
  inletId: string
  sandboxName: string
  indices: number[]
  messages: StreamingMessage[]
}

// Overhead of the `{"messages":[]}` wrapper.
const WRAPPER_BYTES = Buffer.byteLength(JSON.stringify({ messages: [] }))

/**
 * Builds one message per payload and posts them to the batch endpoint, one request per inlet and sandbox.
 * Returns one DeliveryResult per payload, index-matched to the input.
 */
export async function sendMessages(
  request: RequestClient,
  payloads: AepPayload[],
  kind: MessageKind
): Promise<DeliveryResult[]> {
  const results: DeliveryResult[] = new Array(payloads.length)
  const groups = new Map<string, Group>()

  payloads.forEach((payload, index) => {
    let message: StreamingMessage
    try {
      message = buildMessage(payload, kind)
    } catch (error) {
      if (error instanceof PayloadValidationError) {
        results[index] = { ok: false, status: 400, message: error.message, local: true }
        return
      }
      throw error
    }

    if (Buffer.byteLength(JSON.stringify(message)) + WRAPPER_BYTES > MAX_REQUEST_BYTES) {
      results[index] = {
        ok: false,
        status: 413,
        message: 'The event is larger than the 1 MB limit for AEP streaming ingestion.',
        local: true,
        sent: message
      }
      return
    }

    const key = JSON.stringify([payload.inletId, payload.sandboxName])
    let group = groups.get(key)
    if (!group) {
      group = { inletId: payload.inletId, sandboxName: payload.sandboxName, indices: [], messages: [] }
      groups.set(key, group)
    }
    group.indices.push(index)
    group.messages.push(message)
  })

  await Promise.all(Array.from(groups.values()).map((group) => sendGroup(request, group, results)))
  return results
}

async function sendGroup(request: RequestClient, group: Group, results: DeliveryResult[]): Promise<void> {
  const body: BatchStreamingRequest = { messages: group.messages }
  const response: ModifiedResponse<BatchStreamingResponse> = await request<BatchStreamingResponse>(
    batchMessagesUrl(group.inletId),
    {
      method: 'POST',
      headers: { [SANDBOX_HEADER]: group.sandboxName, 'Content-Type': 'application/json' },
      json: body,
      throwHttpErrors: false
    }
  )

  const status = response.status
  const data = isPlainObject(response.data) ? (response.data as BatchStreamingResponse) : undefined

  if (status < 200 || status >= 300) {
    const message = describeError(status, response.data, response.content)
    group.indices.forEach((index, i) => {
      results[index] = {
        ok: false,
        status: normalizeStatus(status),
        message,
        local: false,
        sent: group.messages[i],
        body: response.data
      }
    })
    return
  }

  const entries = Array.isArray(data?.responses) ? data?.responses : undefined
  group.indices.forEach((index, i) => {
    const sent = group.messages[i]
    if (!entries) {
      results[index] = { ok: true, sent, body: data ?? {} }
      return
    }
    const entry = entries[i]
    if (!entry) {
      results[index] = {
        ok: false,
        status: 500,
        message: 'Adobe Experience Platform returned no result for this event.',
        local: false,
        sent,
        body: data
      }
    } else if (typeof entry.statusCode === 'number' && entry.statusCode >= 400) {
      results[index] = {
        ok: false,
        status: normalizeStatus(entry.statusCode),
        message: describeError(entry.statusCode, entry, undefined),
        local: false,
        sent,
        body: entry
      }
    } else {
      results[index] = { ok: true, sent, body: entry }
    }
  })
}

export function toMultiStatus(results: DeliveryResult[]): MultiStatusResponse {
  const multiStatus = new MultiStatusResponse()
  results.forEach((result, index) => {
    if (result.ok) {
      multiStatus.setSuccessResponseAtIndex(index, {
        status: 200,
        sent: result.sent as unknown as JSONLikeObject,
        body: result.body as unknown as JSONLikeObject
      })
    } else {
      multiStatus.setErrorResponseAtIndex(index, {
        status: result.status,
        errortype: result.local && result.status === 400 ? ErrorCodes.PAYLOAD_VALIDATION_FAILED : undefined,
        errormessage: result.message,
        sent: result.sent as unknown as JSONLikeObject | undefined,
        body: result.body as JSONLikeObject | undefined
      })
    }
  })
  return multiStatus
}

// For perform: turn a failed single result into the matching framework error.
export function throwIfFailed(result: DeliveryResult): void {
  if (result.ok) return
  if (result.local && result.status === 400) {
    throw new PayloadValidationError(result.message)
  }
  if (result.status === 401) {
    // Core refreshes the OAuth token and retries on 401.
    throw new InvalidAuthenticationError(result.message)
  }
  throw new APIError(result.message, result.status)
}

export async function send(request: RequestClient, payloads: AepPayload[], kind: MessageKind, isBatch: boolean) {
  const results = await sendMessages(request, payloads, kind)
  if (isBatch) {
    return toMultiStatus(results)
  }
  const [result] = results
  throwIfFailed(result)
  return result.ok ? result.body : undefined
}
