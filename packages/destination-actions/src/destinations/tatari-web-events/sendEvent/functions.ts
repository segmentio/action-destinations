import { isIPv4, isIPv6 } from 'net'
import {
  APIError,
  ErrorCodes,
  JSONLikeObject,
  ModifiedResponse,
  MultiStatusResponse,
  PayloadValidationError
} from '@segment/actions-core'
import { processHashing } from '../../../lib/hashing-utils'
import type { Payload } from './generated-types'
import type { BatchResponse, TatariWebEvent } from './types'

const HEX_SHA256 = /^[a-f0-9]{64}$/i
const HEX_SHA1 = /^[a-f0-9]{40}$/i
const HEX_MD5 = /^[a-f0-9]{32}$/i

const normalizeEmail = (value: string) => value.trim().toLowerCase()

export function hashedEmailFields(email?: string): Pick<TatariWebEvent, 'hem_sha256' | 'hem_sha1' | 'hem_md5'> {
  const value = email?.trim()
  if (!value) return {}

  if (HEX_SHA256.test(value)) return { hem_sha256: value.toLowerCase() }
  if (HEX_SHA1.test(value)) return { hem_sha1: value.toLowerCase() }
  if (HEX_MD5.test(value)) return { hem_md5: value.toLowerCase() }

  return {
    hem_sha256: processHashing(value, 'sha256', 'hex', normalizeEmail),
    hem_sha1: processHashing(value, 'sha1', 'hex', normalizeEmail),
    hem_md5: processHashing(value, 'md5', 'hex', normalizeEmail)
  }
}

/** Proxies occasionally forward `context.ip` as a comma-separated list; the first entry is the client. */
export function ipFields(ip: string): Pick<TatariWebEvent, 'ipv4' | 'ipv6'> {
  const first = ip.split(',')[0].trim()
  if (isIPv4(first)) return { ipv4: first }
  if (isIPv6(first)) return { ipv6: first }
  throw new PayloadValidationError(`ip_address "${first}" is not a valid IPv4 or IPv6 address`)
}

function toRfc3339Utc(timestamp: string | number): string {
  const parsed = new Date(timestamp)
  if (Number.isNaN(parsed.getTime())) {
    throw new PayloadValidationError(`timestamp "${timestamp}" is not a valid date`)
  }
  return parsed.toISOString()
}

function nonEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

const PROMOTED_PROPERTY_KEYS = ['email', 'total', 'revenue', 'url', 'referrer'] as const

function buildArgs(payload: Payload): Record<string, unknown> | undefined {
  const source = payload.args
  const args: Record<string, unknown> =
    source && typeof source === 'object' && !Array.isArray(source) ? { ...(source as Record<string, unknown>) } : {}

  for (const key of PROMOTED_PROPERTY_KEYS) delete args[key]

  const orderId = payload.order_id ?? args.order_id
  if (orderId !== undefined && orderId !== null && String(orderId).trim() !== '') {
    args.order_id = String(orderId)
  } else {
    delete args.order_id
  }

  const orderTotal = payload.order_total ?? args.order_total
  const total = typeof orderTotal === 'string' ? Number(orderTotal) : orderTotal
  if (typeof total === 'number' && Number.isFinite(total)) {
    args.order_total = total
  } else {
    delete args.order_total
  }

  return Object.keys(args).length > 0 ? args : undefined
}

export function buildEvent(payload: Payload): TatariWebEvent {
  const event: TatariWebEvent = {
    event_dt: toRfc3339Utc(payload.timestamp),
    session_id: payload.session_id,
    event: payload.event,
    user_agent: payload.user_agent,
    url: payload.url,
    ...ipFields(payload.ip_address),
    user_id: nonEmpty(payload.user_id),
    distinct_id: nonEmpty(payload.distinct_id),
    referrer_url: nonEmpty(payload.referrer_url),
    args: buildArgs(payload),
    ...hashedEmailFields(payload.email)
  }

  return Object.fromEntries(Object.entries(event).filter(([, v]) => v !== undefined)) as TatariWebEvent
}

function sentSummary(event: TatariWebEvent): JSONLikeObject {
  return { event: event.event, event_dt: event.event_dt, distinct_id: event.distinct_id }
}

export function applyBatchResponse(
  multiStatus: MultiStatusResponse,
  response: ModifiedResponse<BatchResponse>,
  sent: TatariWebEvent[],
  indexMap: number[]
): MultiStatusResponse {
  const body: BatchResponse = response.data ?? {}
  const status = response.status

  if (status !== 200 && status !== 207 && status !== 400) {
    const detail = body.message ?? body.error ?? response.content
    throw new APIError(`Tatari Web Events API responded ${status}: ${detail}`, status)
  }

  const errorsByIndex = body.errors_by_index ?? {}
  const hasPerEventErrors = Object.keys(errorsByIndex).length > 0

  if (status === 400 && !hasPerEventErrors) {
    const message = body.error ?? body.message ?? 'batch rejected'
    sent.forEach((event, i) => {
      multiStatus.setErrorResponseAtIndex(indexMap[i], {
        status: 400,
        errortype: ErrorCodes.BAD_REQUEST,
        errormessage: message,
        sent: sentSummary(event),
        body: body as unknown as JSONLikeObject
      })
    })
    return multiStatus
  }

  sent.forEach((event, i) => {
    const originalIndex = indexMap[i]
    const error = errorsByIndex[String(i)]

    if (error) {
      multiStatus.setErrorResponseAtIndex(originalIndex, {
        status: 400,
        errortype: ErrorCodes.BAD_REQUEST,
        errormessage: error,
        sent: sentSummary(event),
        body: error
      })
    } else if (status === 400) {
      multiStatus.setErrorResponseAtIndex(originalIndex, {
        status: 500,
        errortype: ErrorCodes.RETRYABLE_ERROR,
        errormessage:
          body.message ?? 'batch rejected by REJECT_ALL_IF_ANY_INVALID policy; event was valid and will be retried',
        sent: sentSummary(event),
        body: body as unknown as JSONLikeObject
      })
    } else {
      multiStatus.setSuccessResponseAtIndex(originalIndex, {
        status: 200,
        sent: sentSummary(event),
        body: body as unknown as JSONLikeObject
      })
    }
  })

  return multiStatus
}
