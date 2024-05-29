import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings, AudienceSettings } from '../generated-types'
import type { Payload } from './generated-types'
import { getUpsertURL, hashAndEncode } from '../helpers'
import { IDENTIFIER_TYPES } from '../constants'

const action: ActionDefinition<Settings, Payload, AudienceSettings> = {
  title: 'Sync Audience',
  description: 'Sync Segment Engage Audiences to Dynamic Yield',
  defaultSubscription: 'type = "identify" or type = "track"',
  fields: {
    message_id: {
      label: 'Message ID',
      description: 'Segment event message ID',
      type: 'string',
      unsafe_hidden: true,
      required: true,
      default: {
        '@path': '$.messageId'
      }
    },
    timestamp: {
      label: 'Timestamp',
      description: 'Segment event timestamp',
      type: 'datetime',
      unsafe_hidden: true,
      required: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    audience_id: {
      type: 'string',
      label: 'Audience ID',
      description: 'Unique Audience Identifier returned by the createAudience() function call.',
      required: true,
      unsafe_hidden: true,
      default: {
        '@path': '$.context.personas.computation_id'
      }
    },
    segment_audience_key: {
      label: 'Audience Key',
      description: 'Segment Audience key / name',
      type: 'string',
      unsafe_hidden: true,
      required: true,
      default: {
        '@path': '$.context.personas.computation_key'
      }
    },
    traits_or_props: {
      label: 'Traits or Properties',
      description: 'Traits or Properties object',
      type: 'object',
      unsafe_hidden: true,
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits' },
          then: { '@path': '$.traits' },
          else: { '@path': '$.properties' }
        }
      }
    },
    segment_computation_action: {
      label: 'Segment Computation Action',
      description:
        "Segment computation class used to determine if input event is from an Engage Audience'. Value must be = 'audience'.",
      type: 'string',
      unsafe_hidden: true,
      required: true,
      default: {
        '@path': '$.context.personas.computation_class'
      },
      choices: [{ label: 'audience', value: 'audience' }]
    },
    email: {
      label: 'Email',
      description: "User's email address",
      type: 'string',
      format: 'email',
      required: false,
      unsafe_hidden: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.context.traits.email' }
        }
      }
    },
    anonymousId: {
      label: 'Segment Anonymous Id',
      description: "User's anonymousId",
      type: 'string',
      required: false,
      unsafe_hidden: true,
      default: { '@path': '$.anonymousId' }
    },
    userId: {
      label: 'Segment User Id',
      description: "User's unique User ID",
      type: 'string',
      required: false,
      unsafe_hidden: true,
      default: { '@path': '$.userId' }
    }
  },

  perform: async (request, data) => {
    const { audienceSettings, payload, settings } = data
    const audienceName = audienceSettings?.audience_name
    const audienceValue = payload.traits_or_props[payload.segment_audience_key]
    const { audience_id } = payload

    let primaryIdentifier

    switch (settings.identifier_type) {
      case IDENTIFIER_TYPES.EMAIL:
        primaryIdentifier = payload.email ?? undefined
        break
      case IDENTIFIER_TYPES.SEGMENT_USER_ID:
        primaryIdentifier = payload.userId ?? undefined
        break
      case IDENTIFIER_TYPES.SEGMENT_ANONYMOUS_ID:
        primaryIdentifier = payload.anonymousId ?? undefined
        break
    }

    if (!primaryIdentifier) {
      throw new IntegrationError('Primary Identifier not found', 'MISSING_REQUIRED_FIELD', 400)
    }

    const URL = getUpsertURL(settings.dataCenter)

    return request(URL, {
      method: 'post',
      json: {
        type: 'audience_membership_change_request',
        id: payload.message_id,
        timestamp_ms: new Date(payload.timestamp).getTime(),
        account: {
          account_settings: {
            section_id: settings.sectionId,
            identifier_type: settings.identifier_type,
            accessKey: settings.accessKey
          }
        },
        user_profiles: [
          {
            user_identities: [
              {
                type: settings.identifier_type,
                encoding: settings.identifier_type === 'email' ? '"sha-256"' : 'raw',
                value: settings.identifier_type === 'email' ? hashAndEncode(primaryIdentifier) : primaryIdentifier
              }
            ],
            audiences: [
              {
                audience_id: audience_id,
                audience_name: audienceName,
                action: audienceValue ? 'add' : 'delete'
              }
            ]
          }
        ]
      }
    })
  }
}

export default action
