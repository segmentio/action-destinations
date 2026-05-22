import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { syncAudience } from './functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description: 'Sync a Segment Engage audience to an MNTN audience segment.',
  defaultSubscription: 'type = "identify" or type = "track"',
  fields: {
    segment_id: {
      label: 'MNTN Segment ID',
      description: 'The ID of the MNTN audience segment to sync to. Customers should not need to edit this field.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.context.personas.external_audience_id'
      }
    },
    identity_id: {
      label: 'Identity ID',
      description: 'A stable identifier for this user in MNTN. Defaults to userId, falling back to anonymousId.',
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
      description: "The user's email address. Sent to MNTN in plaintext and as a SHA-256 hash for audience matching.",
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
        "The user's phone number. Non-numeric characters (including the + prefix) are removed, and the number is hashed before sending to MNTN.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.phone' },
          then: { '@path': '$.traits.phone' },
          else: { '@path': '$.properties.phone' }
        }
      }
    },
    ip: {
      label: 'IP Address',
      description: "The user's IPv4 address. Used for probabilistic audience matching in MNTN campaigns.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.ip' },
          then: { '@path': '$.traits.ip' },
          else: { '@path': '$.properties.ip' }
        }
      }
    },
    maid: {
      label: 'Mobile Advertising ID (MAID)',
      description: "The user's Mobile Advertising ID — IDFA on iOS or GAID on Android.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.advertisingId' },
          then: { '@path': '$.traits.advertisingId' },
          else: { '@path': '$.properties.advertisingId' }
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
  perform: (request, { payload, audienceMembership }) => {
    return syncAudience(request, [payload], [audienceMembership], false)
  },
  performBatch: (request, { payload, audienceMembership }) => {
    return syncAudience(request, payload, audienceMembership || [], true)
  }
}

export default action
