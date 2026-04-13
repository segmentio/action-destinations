import { PayloadValidationError } from '@segment/actions-core'
import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { VOICEOPS_CALLS_ENDPOINT } from '../constants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Call Completed',
  description: 'Send a completed call event to Voiceops using the existing Regal-compatible call payload.',
  defaultSubscription: 'type = "track" and event = "call_completed"',
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
      description: 'The time the call started. This should match the existing Regal payload format.',
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
    mp3_Link: {
      label: 'MP3 Link',
      description: 'A link to the single-channel recording for the call.',
      type: 'string',
      format: 'uri',
      default: {
        '@path': '$.properties.mp3_Link'
      }
    },
    multi_channel_recording_link: {
      label: 'Multi-Channel Recording Link',
      description: 'A link to the multi-channel recording when conference splitting is needed.',
      type: 'string',
      format: 'uri',
      default: {
        '@path': '$.properties.multi_channel_recording_link'
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
          description: 'The participant type for the channel.',
          type: 'string'
        },
        recording_start_time: {
          label: 'Recording Start Time',
          description: 'When this participant started in the recording.',
          type: 'string'
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
    const hasAudioUrl = data.payload.multi_channel_recording_link?.trim() || data.payload.mp3_Link?.trim()

    if (!hasAudioUrl) {
      throw new PayloadValidationError('Either mp3_Link or multi_channel_recording_link must be provided.')
    }

    return request(VOICEOPS_CALLS_ENDPOINT, {
      method: 'post',
      json: data.payload
    })
  }
}

export default action
