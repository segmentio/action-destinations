import { PayloadValidationError } from '@segment/actions-core'
import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { VOICEOPS_CALLS_ENDPOINT } from '../constants'

const HANDLING_AGENT_TYPE = 'HANDLING_AGENT'
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateWarmTransferPayload(payload: Payload): void {
  if (payload.channels && payload.agentLegs) {
    throw new PayloadValidationError('Provide only one of channels or agentLegs.')
  }

  for (const channel of payload.channels ?? []) {
    const identifier = channel.identifier
    const trimmedIdentifier = identifier?.trim()

    if (!trimmedIdentifier) {
      throw new PayloadValidationError('channels.identifier is required for every channel entry.')
    }

    if (channel.type === HANDLING_AGENT_TYPE && !EMAIL_REGEX.test(identifier)) {
      throw new PayloadValidationError(
        'channels.identifier must be a valid email address when channels.type is HANDLING_AGENT.'
      )
    }
  }
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Call Completed',
  description: 'Send a completed call event to Voiceops using the canonical Voiceops call payload.',
  defaultSubscription: 'type = "track" and event = "Call Completed"',
  fields: {
    call_id: {
      label: 'Call ID',
      description: 'The external call identifier used by Voiceops.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.properties.call_id'
      }
    },
    call_started_at: {
      label: 'Call Started At',
      description: 'The call start time as a Unix timestamp in seconds, for example `1712683200`.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.properties.call_started_at'
      }
    },
    agent_email: {
      label: 'Agent Email',
      description: 'The email address for the primary handling agent.',
      type: 'string',
      format: 'email',
      required: true,
      default: {
        '@path': '$.properties.agent_email'
      }
    },
    recording_url: {
      label: 'Recording URL',
      description: 'A direct URI to the call recording file, for example `https://example.com/audio.wav`.',
      type: 'string',
      format: 'uri',
      required: true,
      default: {
        '@path': '$.properties.recording_url'
      }
    },
    first_name: {
      label: 'First Name',
      description: 'The first name for the primary handling agent.',
      type: 'string',
      default: {
        '@path': '$.properties.first_name'
      }
    },
    last_name: {
      label: 'Last Name',
      description: 'The last name for the primary handling agent.',
      type: 'string',
      default: {
        '@path': '$.properties.last_name'
      }
    },
    channels: {
      label: 'Channels',
      description:
        'Optional channel metadata for multi-channel audio-aware integrations. Use this when you can provide precise channel-based conference bridge data.',
      type: 'object',
      multiple: true,
      defaultObjectUI: 'arrayeditor',
      properties: {
        channel: {
          label: 'Channel',
          description: 'The audio channel number.',
          type: 'integer',
          required: true
        },
        type: {
          label: 'Type',
          description:
            'The participant role for the channel. Supported values are CONTACT, HANDLING_AGENT, and TRANSFER_AGENT.',
          type: 'string',
          required: true,
          choices: [
            { label: 'Contact', value: 'CONTACT' },
            { label: 'Handling Agent', value: 'HANDLING_AGENT' },
            { label: 'Transfer Agent', value: 'TRANSFER_AGENT' }
          ]
        },
        recording_start_time: {
          label: 'Recording Start Time',
          description:
            'The participant start time as an ISO 8601 / RFC3339 timestamp, for example `2025-12-08T13:32:47.000Z`.',
          type: 'string',
          format: 'date-time',
          required: true
        },
        identifier: {
          label: 'Identifier',
          description:
            'The participant identifier. HANDLING_AGENT entries must use an email address, while CONTACT and TRANSFER_AGENT entries can use any non-empty string.',
          type: 'string',
          required: true
        },
        first_name: {
          label: 'First Name',
          description: 'The participant first name when available.',
          type: 'string'
        },
        last_name: {
          label: 'Last Name',
          description: 'The participant last name when available.',
          type: 'string'
        }
      },
      default: {
        '@arrayPath': [
          '$.properties.channels',
          {
            channel: {
              '@path': '$.channel'
            },
            type: {
              '@path': '$.type'
            },
            recording_start_time: {
              '@path': '$.recording_start_time'
            },
            identifier: {
              '@path': '$.identifier'
            },
            first_name: {
              '@path': '$.first_name'
            },
            last_name: {
              '@path': '$.last_name'
            }
          }
        ]
      }
    },
    agentLegs: {
      label: 'Agent Legs',
      description:
        'Optional warm-transfer metadata for agent handoff windows. Use this when you cannot provide channel-based multi-channel recording data.',
      type: 'object',
      multiple: true,
      defaultObjectUI: 'arrayeditor',
      properties: {
        agent_email: {
          label: 'Agent Email',
          description: 'The email address for the agent handling this leg of the call.',
          type: 'string',
          format: 'email',
          required: true
        },
        started_at: {
          label: 'Started At',
          description:
            'When this agent began handling the call as an ISO 8601 / RFC3339 timestamp, for example `2025-12-08T13:32:47.000Z`.',
          type: 'string',
          format: 'date-time',
          required: true
        },
        ended_at: {
          label: 'Ended At',
          description:
            'When this agent stopped handling the call as an ISO 8601 / RFC3339 timestamp, for example `2025-12-08T13:37:47.000Z`.',
          type: 'string',
          format: 'date-time'
        },
        first_name: {
          label: 'First Name',
          description: 'The first name of the agent for this call leg.',
          type: 'string'
        },
        last_name: {
          label: 'Last Name',
          description: 'The last name of the agent for this call leg.',
          type: 'string'
        }
      },
      default: {
        '@arrayPath': [
          '$.properties.agentLegs',
          {
            agent_email: {
              '@path': '$.agent_email'
            },
            started_at: {
              '@path': '$.started_at'
            },
            ended_at: {
              '@path': '$.ended_at'
            },
            first_name: {
              '@path': '$.first_name'
            },
            last_name: {
              '@path': '$.last_name'
            }
          }
        ]
      }
    },
    extraMetadata: {
      label: 'Extra Metadata',
      description: 'Additional call metadata to forward to Voiceops unchanged.',
      type: 'object',
      additionalProperties: true,
      default: {
        '@path': '$.properties.extraMetadata'
      }
    }
  },
  perform: (request, data) => {
    validateWarmTransferPayload(data.payload)

    return request(VOICEOPS_CALLS_ENDPOINT, {
      method: 'post',
      json: data.payload
    })
  }
}

export default action
