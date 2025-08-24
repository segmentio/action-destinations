import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { SEGMENT_DMP_ID } from '../constants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Ingest',
  description: 'Uploads a list of AudienceMember resources to the provided Destination.',
  defaultSubscription: 'event = "Audience Entered" or event = "Audience Exited"',
  fields: {
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
      default: true,
      unsafe_hidden: true
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
    const { payload, audienceSettings, auth } = data
    // You should get the access token from the request context or settings
    const accessToken = auth?.accessToken || ''
    if (!accessToken) {
      throw new Error('Missing access token.')
    }
    // Example static data for demonstration; replace with actual payload mapping as needed
    const body = {
      audienceMembers: [
        {
          consent: {
            adUserData: 'CONSENT_GRANTED',
            adPersonalization: 'CONSENT_GRANTED'
          },
          userData: {
            userIdentifiers: [
              {
                emailAddress: payload.emailAddress,
                phoneNumber: payload.phoneNumber,
                address: {
                  givenName: payload.givenName,
                  familyName: payload.familyName,
                  regionCode: payload.regionCode,
                  postalCode: payload.postalCode
                }
              }
            ]
          }
        }
      ],
      destinations: [
        {
          operatingAccount: {
            accountId: audienceSettings.advertiserId, // customer id
            product: audienceSettings.product // TODO: add multiple entries for different products
          },
          loginAccount: {
            accountId: `${SEGMENT_DMP_ID}`, // segment id
            product: 'DATA_PARTNER'
          },
          productDestinationId: audienceSettings.productDestinationId
        }
      ],
      encoding: 'BASE64'
    }
    return request('https://datamanager.googleapis.com/v1/audienceMembers:ingest', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`, // this is segment auth token
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      json: body
    })
  },
  performBatch: async (_request, _data) => {
    return
  }
}
export default action
