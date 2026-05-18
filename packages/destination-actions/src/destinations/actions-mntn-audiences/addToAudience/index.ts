import { createHash } from 'crypto'
import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const MNTN_API_BASE = 'https://integrations.ex.mountain.com'

/**
 * Returns the SHA-256 hex digest of the given (already-normalized) string.
 * MNTN accepts SHA-256 hashed variants of email and phone as 1st-class identifiers,
 * which allows matching without transmitting plaintext PII.
 */
function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add to Audience',
  description:
    'Add a user to an MNTN audience segment when they enter a Segment Engage audience. Sends all available identity signals (email, phone, IP address, MAID) to MNTN for audience matching.',

  defaultSubscription: 'event = "Audience Entered"',

  fields: {
    segment_id: {
      label: 'MNTN Segment ID',
      description:
        'The ID of the MNTN audience segment to add this user to. Automatically populated from the audience setup — do not change unless you need to override it.',
      type: 'string',
      required: true,
      default: {
        // Segment stores the externalId returned by createAudience here.
        '@path': '$.context.personas.external_audience_id'
      }
    },

    identity_id: {
      label: 'Identity ID',
      description:
        'A stable identifier for this user within MNTN, used to uniquely represent their segment membership. Must be consistent between add and remove operations. Defaults to userId, falling back to anonymousId.',
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
        "The user's email address. Sent to MNTN in plaintext and as a SHA-256 hash — both are 1st-class identifiers for audience matching.",
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
        "The user's phone number in E.164 format (e.g. +15556004638). Sent to MNTN in plaintext and as a SHA-256 hash — both are 1st-class identifiers for audience matching.",
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
      description:
        "The user's IPv4 address at the time of the event. Used for probabilistic audience matching in MNTN campaigns.",
      type: 'string',
      default: {
        '@path': '$.context.ip'
      }
    },

    maid: {
      label: 'Mobile Advertising ID (MAID)',
      description:
        "The user's Mobile Advertising ID — IDFA on iOS or GAID on Android. Used for mobile audience matching.",
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
      description: 'ISO 8601 timestamp of when this audience membership event occurred. Sent to MNTN as `source_time`.',
      type: 'string',
      default: {
        '@path': '$.timestamp'
      }
    }
  },

  perform: (request, { payload }) => {
    // Build the identifiers array with every signal that is present.
    // MNTN recommends providing as many signals as possible to maximize match rates.
    const identifiers: Array<{ kind: string; value: string }> = []

    if (payload.email) {
      const normalizedEmail = payload.email.toLowerCase().trim()
      identifiers.push({ kind: 'email', value: normalizedEmail })
      identifiers.push({ kind: 'email_sha256', value: sha256(normalizedEmail) })
    }

    if (payload.phone) {
      const normalizedPhone = payload.phone.trim()
      identifiers.push({ kind: 'phone', value: normalizedPhone })
      identifiers.push({ kind: 'phone_sha256', value: sha256(normalizedPhone) })
    }

    if (payload.ip) {
      identifiers.push({ kind: 'ipv4', value: payload.ip.trim() })
    }

    if (payload.maid) {
      identifiers.push({ kind: 'maid', value: payload.maid.trim() })
    }

    const segmentId = encodeURIComponent(payload.segment_id)

    return request(`${MNTN_API_BASE}/v2026/audience/segments/${segmentId}/identities`, {
      method: 'POST',
      json: {
        identity: {
          // `id` is the caller-assigned stable key for this user — used for deletion on exit.
          id: payload.identity_id,
          // `source` identifies the data origin for auditability in MNTN.
          source: 'segment',
          // `source_time` tells MNTN when this membership event occurred.
          ...(payload.timestamp ? { source_time: { rfc3339: payload.timestamp } } : {}),
          identifiers
        }
      }
    })
  }
}

export default action
