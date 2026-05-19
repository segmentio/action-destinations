import { createHash } from 'crypto'
import { ActionDefinition, MultiStatusResponse, JSONLikeObject } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const MNTN_API_BASE = 'https://integrations.ex.mountain.com'

/**
 * Returns the SHA-256 hex digest of the given string.
 */
function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

interface IdentityPayload {
  id: string
  source: string
  source_time?: { rfc3339: string }
  identifiers: Array<{ kind: string; value: string }>
}

/**
 * Builds the MNTN identity object from a payload.
 * Normalizes email (lowercase) and phone (strip all non-numeric chars including +)
 * before sending and hashing, per MNTN API spec.
 */
function buildIdentity(payload: Payload): IdentityPayload {
  const identifiers: Array<{ kind: string; value: string }> = []

  if (payload.email) {
    const normalizedEmail = payload.email.toLowerCase().trim()
    identifiers.push({ kind: 'email', value: normalizedEmail })
    identifiers.push({ kind: 'email_sha256', value: sha256(normalizedEmail) })
  }

  if (payload.phone) {
    // API requires stripping all non-numeric characters (including the + prefix) before
    // sending and hashing. E.g. '+15556004638' -> '15556004638'.
    const normalizedPhone = payload.phone.replace(/\D/g, '')
    identifiers.push({ kind: 'phone', value: normalizedPhone })
    identifiers.push({ kind: 'phone_sha256', value: sha256(normalizedPhone) })
  }

  if (payload.ip) {
    identifiers.push({ kind: 'ipv4', value: payload.ip.trim() })
  }

  if (payload.maid) {
    identifiers.push({ kind: 'maid', value: payload.maid.trim() })
  }

  return {
    id: payload.identity_id,
    source: 'segment',
    ...(payload.timestamp ? { source_time: { rfc3339: payload.timestamp } } : {}),
    identifiers
  }
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description:
    'Sync a Segment Engage audience member into or out of an MNTN audience segment. ' +
    'Reads the audience membership boolean from the event traits or properties to determine ' +
    'whether to add or remove the user.',

  defaultSubscription: 'type = "identify" or type = "track"',

  fields: {
    segment_id: {
      label: 'MNTN Segment ID',
      description:
        'The ID of the MNTN audience segment to sync this user into or out of. ' +
        'Automatically populated from the audience setup — do not change unless overriding.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.context.personas.external_audience_id'
      }
    },

    audience_key: {
      label: 'Audience Key',
      description:
        'The Segment Engage computation key for this audience. Used to read the membership ' +
        'boolean from the event traits or properties to determine add vs. remove.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.context.personas.computation_key'
      }
    },

    traits_or_properties: {
      label: 'Traits or Properties',
      description:
        'The traits (identify events) or properties (track events) object from the Engage event. ' +
        'The membership boolean for this audience is read from this object using the Audience Key.',
      type: 'object',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits' },
          then: { '@path': '$.traits' },
          else: { '@path': '$.properties' }
        }
      }
    },

    identity_id: {
      label: 'Identity ID',
      description:
        'A stable identifier for this user in MNTN. Must be consistent between add and remove ' +
        'operations for the same user. Defaults to userId, falling back to anonymousId.',
      type: 'string',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      }
    },

    email: {
      label: 'Email Address',
      description:
        "The user's email address. Sent to MNTN in plaintext and as a SHA-256 hash for audience matching.",
      type: 'string',
      format: 'email',
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.context.traits.email' }
        }
      }
    },

    phone: {
      label: 'Phone Number',
      description:
        "The user's phone number. All non-numeric characters (including the + prefix) are stripped " +
        'before sending and hashing per MNTN API spec. Sent in normalized form and as a SHA-256 hash.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.phone' },
          then: { '@path': '$.traits.phone' },
          else: { '@path': '$.context.traits.phone' }
        }
      }
    },

    ip: {
      label: 'IP Address',
      description: "The user's IPv4 address. Used for probabilistic audience matching in MNTN campaigns.",
      type: 'string',
      default: {
        '@path': '$.context.ip'
      }
    },

    maid: {
      label: 'Mobile Advertising ID (MAID)',
      description: "The user's Mobile Advertising ID — IDFA on iOS or GAID on Android.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.context.device.advertisingId' },
          then: { '@path': '$.context.device.advertisingId' },
          else: { '@path': '$.context.device.id' }
        }
      }
    },

    timestamp: {
      label: 'Event Timestamp',
      description: 'ISO 8601 timestamp of when this audience membership event occurred. Sent to MNTN as source_time.',
      type: 'string',
      default: {
        '@path': '$.timestamp'
      }
    }
  },

  perform: (request, { payload }) => {
    const isAdd = !!(payload.traits_or_properties?.[payload.audience_key])
    const segmentId = encodeURIComponent(payload.segment_id)

    if (isAdd) {
      return request(`${MNTN_API_BASE}/v2026/audience/segments/${segmentId}/identities`, {
        method: 'POST',
        json: { identity: buildIdentity(payload) }
      })
    }

    return request(
      `${MNTN_API_BASE}/v2026/audience/segments/${segmentId}/identities/${encodeURIComponent(payload.identity_id)}`,
      { method: 'DELETE' }
    )
  },

  performBatch: async (request, { payload }) => {
    const msResponse = new MultiStatusResponse()

    // Group payloads by segment_id, separating adds from removes within each group.
    // In practice Engage sends a single segment per batch, but we handle multiple to be safe.
    type GroupEntry = { index: number; p: Payload }
    const groups = new Map<string, { adds: GroupEntry[]; removes: GroupEntry[] }>()

    payload.forEach((p, index) => {
      if (!groups.has(p.segment_id)) {
        groups.set(p.segment_id, { adds: [], removes: [] })
      }
      const group = groups.get(p.segment_id)!
      const isAdd = !!(p.traits_or_properties?.[p.audience_key])
      if (isAdd) {
        group.adds.push({ index, p })
      } else {
        group.removes.push({ index, p })
      }
    })

    for (const [segmentId, { adds, removes }] of groups) {
      const encodedSegmentId = encodeURIComponent(segmentId)

      // Batch add: POST { identities: [...] } — native batch support per MNTN API spec
      if (adds.length > 0) {
        try {
          await request(`${MNTN_API_BASE}/v2026/audience/segments/${encodedSegmentId}/identities`, {
            method: 'POST',
            json: { identities: adds.map(({ p }) => buildIdentity(p)) }
          })
          adds.forEach(({ index, p }) => {
            msResponse.setSuccessResponseAtIndex(index, {
              status: 202,
              sent: p as unknown as JSONLikeObject,
              body: {}
            })
          })
        } catch (error) {
          const status = (error as any)?.response?.status ?? 500
          const errormessage = (error as any)?.message ?? 'Failed to add identities to MNTN segment.'
          adds.forEach(({ index }) => {
            msResponse.setErrorResponseAtIndex(index, { status, errormessage, body: {} })
          })
        }
      }

      // Batch remove: DELETE with comma-separated, URL-encoded IDs in path
      // Per MNTN API spec, both the ID values and the comma separator must be URL-encoded.
      if (removes.length > 0) {
        const encodedIds = removes.map(({ p }) => encodeURIComponent(p.identity_id)).join('%2C')
        try {
          await request(
            `${MNTN_API_BASE}/v2026/audience/segments/${encodedSegmentId}/identities/${encodedIds}`,
            { method: 'DELETE' }
          )
          removes.forEach(({ index, p }) => {
            msResponse.setSuccessResponseAtIndex(index, {
              status: 202,
              sent: p as unknown as JSONLikeObject,
              body: {}
            })
          })
        } catch (error) {
          const status = (error as any)?.response?.status ?? 500
          const errormessage = (error as any)?.message ?? 'Failed to remove identities from MNTN segment.'
          removes.forEach(({ index }) => {
            msResponse.setErrorResponseAtIndex(index, { status, errormessage, body: {} })
          })
        }
      }
    }

    return msResponse
  }
}

export default action
