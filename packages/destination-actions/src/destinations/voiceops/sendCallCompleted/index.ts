import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { VOICEOPS_CALLS_ENDPOINT } from '../constants'

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
        'Optional channel metadata used by Voiceops to split conference bridge recordings and attribute agents.',
      type: 'object',
      multiple: true,
      defaultObjectUI: 'arrayeditor',
      properties: {
        channel: {
          label: 'Channel',
          description: 'The audio channel number.',
          type: 'integer'
        },
        type: {
          label: 'Type',
          description:
            'The participant role for the channel. Supported values are CONTACT, HANDLING_AGENT, and TRANSFER_AGENT.',
          type: 'string',
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
          format: 'date-time'
        },
        identifier: {
          label: 'Identifier',
          description: 'A participant identifier, usually an email address.',
          type: 'string'
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
    extraMetadata: {
      label: 'Extra Metadata',
      description: 'Additional org-specific call metadata to forward to Voiceops unchanged.',
      type: 'object',
      additionalProperties: true,
      default: {
        '@path': '$.properties.extraMetadata'
      }
    }
  },
  perform: (request, data) => {
    return request(VOICEOPS_CALLS_ENDPOINT, {
      method: 'post',
      json: data.payload
    })
  }
}

export default action
