import { PayloadValidationError } from '@segment/actions-core'
import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getVoiceopsMetadataEndpoint } from '../constants'

const RESERVED_METADATA_FIELDS = [
  'call_id',
  'call_started_at',
  'recording_url',
  'agent_email',
  'channels',
  'agentLegs',
  'voiceops_segment_source_call_id',
  'source'
]

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update Call Metadata',
  description:
    'Send a complete call metadata snapshot to reconcile with a recording received before or after this event. No recording URL or agent email is required.',
  defaultSubscription: 'type = "track" and event = "call.completed"',
  fields: {
    call_id: {
      label: 'Call ID',
      description:
        'The same external call identifier sent with the recording. Use up to 100 letters, numbers, dots, hyphens, or underscores.',
      type: 'string',
      required: true,
      default: { '@path': '$.properties.call_id' }
    },
    call_completed_at: {
      label: 'Call Completed At',
      description:
        'The completion event time as a 10-digit Unix timestamp in seconds. Voiceops uses this to order metadata snapshots. Map Regal completed_at here; do not use the delivery or retry time.',
      type: 'string',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.properties.call_completed_at' },
          then: { '@path': '$.properties.call_completed_at' },
          else: { '@path': '$.properties.completed_at' }
        }
      }
    },
    extraMetadata: {
      label: 'Extra Metadata',
      description:
        'A nonempty, complete snapshot of call metadata, such as disposition and contact phone. Map individual metadata fields here. Do not include call_id, call_started_at, recording_url, agent_email, channels, agentLegs, voiceops_segment_source_call_id, or source.',
      type: 'object',
      additionalProperties: true,
      required: true,
      default: { '@path': '$.properties.extraMetadata' }
    }
  },
  perform: (request, { settings, payload }) => {
    if (!/^[a-zA-Z0-9._-]{1,100}$/.test(payload.call_id)) {
      throw new PayloadValidationError('call_id must contain 1 to 100 letters, numbers, dots, hyphens, or underscores.')
    }

    if (!/^\d{10}$/.test(payload.call_completed_at)) {
      throw new PayloadValidationError('call_completed_at must be a 10-digit Unix timestamp in seconds.')
    }

    if (Object.keys(payload.extraMetadata).length === 0) {
      throw new PayloadValidationError('extraMetadata must contain at least one metadata field.')
    }

    const reservedField = RESERVED_METADATA_FIELDS.find((field) =>
      Object.prototype.hasOwnProperty.call(payload.extraMetadata, field)
    )
    if (reservedField) {
      throw new PayloadValidationError(`extraMetadata must not contain the reserved field '${reservedField}'.`)
    }

    return request(getVoiceopsMetadataEndpoint(settings.baseUrl), {
      method: 'post',
      json: payload
    })
  }
}

export default action
