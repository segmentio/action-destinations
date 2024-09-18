import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description: 'Sync Segment Engage Audiences to Snapchat',
  defaultSubscription: 'type = "identify" or type = "track"',
  fields: {
    external_audience_id: {
      type: 'string',
      label: 'External Audience ID',
      description: 'Unique Audience Identifier returned by the createAudience() function call.',
      required: true,
      unsafe_hidden: true,
      default: {
        '@path': '$.context.personas.external_audience_id'
      }
    },
    schema_type: {
      type: 'string',
      multiple: true,
      choices: [
        { value: 'MOBILE_AD_ID_SHA256', label: 'Mobile ID' },
        { value: 'PHONE_SHA256', label: 'Phone' },
        { value: 'EMAIL_SHA256', label: 'Email' }
      ],
      label: 'External ID Type',
      description:
        'Choose the type of identifier to use when adding users to Snapchat. If selecting Mobile ID or Phone, ensure these identifiers are included as custom traits in the Audience settings page where the destination is connected.',
      default: 'EMAIL_SHA256'
    },
    mobile_id: {
      label: 'Mobile Identifier Type (Optional)',
      description:
        'The identifier used for the profile’s mobile ID. If left empty, Segment will automatically search the payload for either an iOS or Android ID and use the first one it finds.',
      type: 'string',
      required: false,
      default: {
        '@path': '$.context.personas.computation_key'
      }
    },
    segment_audience_key: {
      label: 'Audience Key',
      description: 'Segment Audience Key',
      type: 'string',
      unsafe_hidden: true,
      required: true,
      default: {
        '@path': '$.context.personas.computation_key'
      }
    },
    traits: {
      label: 'Segment Profile Traits',
      description: 'Traits object',
      type: 'object',
      unsafe_hidden: true,
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.context.traits' },
          then: { '@path': '$.context.traits' },
          else: { '@path': '$.traits' }
        }
      }
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
          exists: { '@path': '$.context.traits.email' },
          then: { '@path': '$.context.traits.email' },
          else: { '@path': '$.traits.email' }
        }
      }
    }
  },
  perform: async (request, { audienceSettings, payload }) => {
    const { traits, segment_audience_key, email, external_audience_id, schema_type } = payload

    request(`https://adsapi.snapchat.com/v1/segments/${external_audience_id}/users`, {
      method: 'post',
      json: {
        data: {
          users: [
            {
              schema: [`${schema_type}`],
              data: [['userabc123']]
            }
          ]
        }
      }
    })
  }
}

export default action


const extractIdentifier = (schemaType: string, traits: string, mobileId: string) => {

}
