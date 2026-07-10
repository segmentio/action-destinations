import { PayloadValidationError } from '@segment/actions-core'
import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getVoiceopsCallsEndpoint } from '../constants'

const HANDLING_AGENT_TYPE = 'HANDLING_AGENT'
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UNIX_SECONDS_PATTERN = /^\d{10}$/

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

function splitNameFromEmail(email?: string): { first_name?: string; last_name?: string } {
  const localPart = email?.split('@')[0]?.split('+')[0]
  const nameParts = localPart?.split(/[^a-zA-Z0-9]+/).filter(Boolean) ?? []

  if (nameParts.length === 0) {
    return {}
  }

  return {
    first_name: titleCase(nameParts[0]),
    last_name: nameParts.length > 1 ? nameParts.slice(1).map(titleCase).join(' ') : ''
  }
}

function withEmailSplitNames(payload: Payload): Payload {
  if (!payload.assign_first_last_name_by_splitting_email) {
    return payload
  }

  const primaryAgentName = splitNameFromEmail(payload.agent_email)

  return {
    ...payload,
    agent_first_name: payload.agent_first_name || primaryAgentName.first_name,
    agent_last_name: payload.agent_last_name || primaryAgentName.last_name,
    agentLegs: payload.agentLegs?.map((agentLeg) => {
      const splitName = splitNameFromEmail(agentLeg.agent_email)

      return {
        ...agentLeg,
        first_name: agentLeg.first_name || splitName.first_name,
        last_name: agentLeg.last_name || splitName.last_name
      }
    })
  }
}

function validateSegmentPayload(payload: Payload): void {
  if (!UNIX_SECONDS_PATTERN.test(payload.call_started_at)) {
    throw new PayloadValidationError('call_started_at must be a 10-digit Unix timestamp in seconds.')
  }

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

  for (const agentLeg of payload.agentLegs ?? []) {
    if (!agentLeg.first_name?.trim()) {
      throw new PayloadValidationError(
        'agentLegs.first_name is required for every agent leg entry. Provide first_name and last_name, or enable assign_first_last_name_by_splitting_email and provide an agent_email that can be split.'
      )
    }

    if (agentLeg.last_name === undefined || agentLeg.last_name === null) {
      throw new PayloadValidationError(
        'agentLegs.last_name is required for every agent leg entry. Provide first_name and last_name, or enable assign_first_last_name_by_splitting_email and provide an agent_email that can be split. Single-token email local-parts derive an empty last_name.'
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
    customer_first_name: {
      label: 'Customer First Name',
      description: 'The first name for the customer.',
      type: 'string',
      default: {
        '@path': '$.properties.customer_first_name'
      }
    },
    customer_last_name: {
      label: 'Customer Last Name',
      description: 'The last name for the customer.',
      type: 'string',
      default: {
        '@path': '$.properties.customer_last_name'
      }
    },
    agent_first_name: {
      label: 'Agent First Name',
      description: 'The first name for the primary handling agent.',
      type: 'string',
      default: {
        '@path': '$.properties.agent_first_name'
      }
    },
    agent_last_name: {
      label: 'Agent Last Name',
      description: 'The last name for the primary handling agent.',
      type: 'string',
      default: {
        '@path': '$.properties.agent_last_name'
      }
    },
    assign_first_last_name_by_splitting_email: {
      label: 'Assign First / Last Name By Splitting Email',
      description:
        'When enabled, missing agent first and last names are derived from agent email addresses by splitting the email local-part. Single-token local-parts derive the first name and set last name to an empty string.',
      type: 'boolean',
      default: {
        '@path': '$.properties.assign_first_last_name_by_splitting_email'
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
        'Optional warm-transfer metadata for agent handoff windows. Use this when you cannot provide channel-based multi-channel recording data. Each leg must include first and last name, or enable Assign First / Last Name By Splitting Email and provide a splittable agent email.',
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
          description:
            'The first name of the agent for this call leg. Required unless Assign First / Last Name By Splitting Email derives it from agent email.',
          type: 'string'
        },
        last_name: {
          label: 'Last Name',
          description:
            'The last name of the agent for this call leg. Required unless Assign First / Last Name By Splitting Email derives it from agent email; single-token email local-parts derive an empty last name.',
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
    const payload = withEmailSplitNames(data.payload)
    validateSegmentPayload(payload)

    return request(getVoiceopsCallsEndpoint(data.settings.baseUrl), {
      method: 'post',
      json: payload
    })
  }
}

export default action
