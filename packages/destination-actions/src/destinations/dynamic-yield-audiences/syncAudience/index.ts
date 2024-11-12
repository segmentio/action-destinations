import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings, AudienceSettings } from '../generated-types'
import type { Payload } from './generated-types'
import { getUpsertURL, hashAndEncode, getDataCenter, getSectionId } from '../helpers'

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
    external_audience_id: {
      type: 'string',
      label: 'External Audience ID',
      description: 'Unique Audience Identifier returned by the createAudience() function call.',
      required: true,
      unsafe_hidden: false,
      default: {
        '@path': '$.context.personas.external_audience_id'
      }
    },
    segment_audience_key: {
      label: 'Audience Key',
      description: 'Segment Audience key / name',
      type: 'string',
      unsafe_hidden: false,
      required: true,
      default: {
        '@path': '$.context.personas.computation_key'
      }
    },
    traits_or_props: {
      label: 'Traits or Properties',
      description: 'Traits or Properties object',
      type: 'object',
      unsafe_hidden: false,
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

  perform: async (request, { audienceSettings, payload, settings }) => {
    const { external_audience_id } = payload

    if (!audienceSettings?.audience_name) {
      throw new IntegrationError('Audience Name is required', 'MISSING_REQUIRED_FIELD', 400)
    }

    if (!audienceSettings?.identifier_type) {
      throw new IntegrationError('Identifier Type is required', 'MISSING_REQUIRED_FIELD', 400)
    }

    if (!external_audience_id) {
      throw new IntegrationError('External Audience ID is required', 'MISSING_REQUIRED_FIELD', 400)
    }

    const audienceName = audienceSettings?.audience_name
    const identifierType = audienceSettings?.identifier_type ?? ''
    const normalizedIdentifierType = identifierType.toLowerCase().replace(/_/g, '')
    const audienceValue = payload.traits_or_props[payload.segment_audience_key]
    let sendNormalizeIdType = false

    let primaryIdentifier: string | undefined

    switch (normalizedIdentifierType) {
      case 'email':
        primaryIdentifier = payload.email ?? undefined
        break
      case 'userid':
        primaryIdentifier = payload.userId ?? undefined
        break
      case 'anonymousid':
        primaryIdentifier = payload.anonymousId ?? undefined
        break
      default: {
        primaryIdentifier = (payload.traits_or_props[identifierType] as string) ?? undefined
        sendNormalizeIdType = false
      }
    }

    if (!primaryIdentifier) {
      throw new IntegrationError('Primary Identifier not found', 'MISSING_REQUIRED_FIELD', 400)
    }

    const idTypeToSend = sendNormalizeIdType ? normalizedIdentifierType : identifierType

    // Receives the sectionId plain with the dev prefix if provided
    const dataCenter = getDataCenter(settings.sectionId)

    const URL = getUpsertURL(dataCenter)

    const json = {
      type: 'audience_membership_change_request',
      id: payload.message_id,
      timestamp_ms: new Date(payload.timestamp).getTime(),
      account: {
        account_settings: {
          sectionId: getSectionId(settings.sectionId),
          identifier: idTypeToSend,
          connectionKey: settings.accessKey
        }
      },
      user_profiles: [
        {
          user_identities: [
            {
              type: idTypeToSend,
              encoding: idTypeToSend === 'email' ? '"sha-256"' : 'raw',
              value: idTypeToSend === 'email' ? hashAndEncode(primaryIdentifier) : primaryIdentifier
            }
          ],
          audiences: [
            {
              audience_id: Number(external_audience_id), // must be sent as an integer
              audience_name: audienceName,
              action: audienceValue ? 'add' : 'delete'
            }
          ]
        }
      ]
    }

    return request(URL, {
      method: 'post',
      json
    })
  }
}

export default action
