import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Ingest',
  description: 'Uploads a list of AudienceMember resources to the provided Destination.',
  defaultSubscription: 'event = "Audience Entered" or event = "Audience Exited"',
  fields: {
    destinations: {
      label: 'Destinations',
      description:
        'List of destinations to which the audience will be synced. Each destination must have a unique combination of operatingAccountId, product, and productDestinationId.',
      type: 'object' as FieldType,
      multiple: true,
      // defaultObjectUI: 'arrayeditor',
      // additionalProperties: true,
      // required: CREATE_OPERATION,
      // depends_on: CREATE_OPERATION,
      properties: {
        operatingAccountId: {
          label: 'Operating Account ID',
          description:
            'The ID of the operating account, used throughout Google Data Manager. Use this ID when you contact Google support to help our teams locate your specific account.',
          type: 'string',
          required: true
        },
        product: {
          label: 'Product',
          description: 'The product for which you want to create or manage audiences.',
          type: 'string',
          multiple: true,
          required: true,
          choices: [
            { label: 'Google Ads', value: 'GOOGLE_ADS' },
            { label: 'Display & Video 360', value: 'DISPLAY_VIDEO_360' }
          ]
        },
        productDestinationId: {
          label: 'Product Destination ID',
          description:
            'The ID of the product destination, used to identify the specific destination for audience management.',
          type: 'string',
          required: true
        },
        emailAddress: {
          label: 'Email Address',
          description: 'The email address of the audience member.',
          type: 'string',
          required: true,
          default: { '@path': '$.traits.email' }
        },
        phoneNumber: {
          label: 'Phone Number',
          description: 'The phone number of the audience member.',
          type: 'string',
          required: false,
          default: { '@path': '$.traits.phone' }
        },
        givenName: {
          label: 'Given Name',
          description: 'The given name (first name) of the audience member.',
          type: 'string',
          required: false,
          default: { '@path': '$.traits.firstName' }
        },
        familyName: {
          label: 'Family Name',
          description: 'The family name (last name) of the audience member.',
          type: 'string',
          required: false,
          default: { '@path': '$.traits.lastName' }
        },
        regionCode: {
          label: 'Region Code',
          description: 'The region code (e.g., country code) of the audience member.',
          type: 'string',
          required: false,
          default: { '@path': '$.traits.countryCode' }
        },
        postalCode: {
          label: 'Postal Code',
          description: 'The postal code of the audience member.',
          type: 'string',
          required: false,
          default: { '@path': '$.traits.postalCode' }
        },
        audienceId: {
          label: 'Audience ID',
          type: 'string',
          required: true,
          unsafe_hidden: true,
          description:
            'A number value representing the Amazon audience identifier. This is the identifier that is returned during audience creation.',
          default: {
            '@path': '$.context.personas.external_audience_id'
          }
        },
        enable_batching: {
          label: 'Enable Batching',
          description: 'When enabled,segment will send data in batching',
          type: 'boolean',
          required: true,
          default: true
        },
        batch_size: {
          label: 'Batch Size',
          description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
          type: 'number',
          unsafe_hidden: true,
          required: false,
          default: 10000
        }
      },

      perform: async (request, data) => {
        const { payload } = data
        const projectId = 'test-project-id' // Replace it with actual project ID from settings or environment
        if (!projectId) {
          throw new Error('Missing Google Cloud project ID.')
        }
        return request('https://datamanager.googleapis.com/v1/audienceMembers:ingest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-User-Project': projectId,
            Accept: 'application/json'
          },
          json: payload
        })
      },
      performBatch: async (_request, _data) => {
        return
      }
    }
  }
}
export default action
