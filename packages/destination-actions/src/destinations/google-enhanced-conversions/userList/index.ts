import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { handleUpdate } from '../functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Customer Match User List',
  description: 'Sync a Segment Engage Audience into a Google Customer Match User List.',
  defaultSubscription: 'event = "Audience Entered" or event = "Audience Exited"',
  fields: {
    first_name: {
      label: 'First Name',
      description: "The user's first name.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.firstName' },
          then: { '@path': '$.context.traits.firstName' },
          else: { '@path': '$.properties.firstName' }
        }
      }
    },
    last_name: {
      label: 'Last Name',
      description: "The user's last name.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.lastName' },
          then: { '@path': '$.context.traits.lastName' },
          else: { '@path': '$.properties.lastName' }
        }
      }
    },
    email: {
      label: 'Email',
      description: "The user's email address.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.email' },
          then: { '@path': '$.context.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      }
    },
    phone: {
      label: 'Phone',
      description: "The user's phone number.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.phone' },
          then: { '@path': '$.context.traits.phone' },
          else: { '@path': '$.properties.phone' }
        }
      }
    },
    country_code: {
      label: 'Country Code',
      description: "The user's country code.",
      type: 'string'
    },
    postal_code: {
      label: 'Postal Code',
      description: "The user's postal code.",
      type: 'string'
    },
    crm_id: {
      label: 'CRM ID',
      description: 'Advertiser-assigned user ID for Customer Match upload.',
      type: 'string'
    },
    mobile_advertising_id: {
      label: 'Mobile Advertising ID',
      description: 'Mobile device ID (advertising ID/IDFA).',
      type: 'string',
      default: {
        '@path': '$.context.device.advertisingId'
      }
    },
    ad_user_data_consent_state: {
      label: 'Ad User Data Consent State',
      description:
        'This represents consent for ad user data.For more information on consent, refer to [Google Ads API Consent](https://developers.google.com/google-ads/api/rest/reference/rest/v15/Consent).',
      type: 'string',
      choices: [
        { label: 'GRANTED', value: 'GRANTED' },
        { label: 'DENIED', value: 'DENIED' },
        { label: 'UNSPECIFIED', value: 'UNSPECIFIED' }
      ],
      required: true
    },
    ad_personalization_consent_state: {
      label: 'Ad Personalization Consent State',
      type: 'string',
      description:
        'This represents consent for ad personalization. This can only be set for OfflineUserDataJobService and UserDataService.For more information on consent, refer to [Google Ads API Consent](https://developers.google.com/google-ads/api/rest/reference/rest/v15/Consent).',
      choices: [
        { label: 'GRANTED', value: 'GRANTED' },
        { label: 'DENIED', value: 'DENIED' },
        { label: 'UNSPECIFIED', value: 'UNSPECIFIED' }
      ],
      required: true
    },
    external_audience_id: {
      label: 'External Audience ID',
      description: 'The ID of the List that users will be synced to.',
      type: 'string',
      default: {
        '@path': '$.context.personas.external_audience_id'
      },
      unsafe_hidden: true
    },
    enable_batching: {
      label: 'Enable Batching',
      description: 'Enable batching for the request.',
      type: 'boolean',
      default: true,
      unsafe_hidden: true
    },
    event_name: {
      label: 'Event Name',
      description: 'The name of the current Segment event.',
      type: 'string',
      default: {
        '@path': '$.event'
      },
      required: true,
      readOnly: true
    }
  },
  perform: async (request, { settings, audienceSettings, payload, statsContext }) => {
    return await handleUpdate(request, settings, audienceSettings, [payload], statsContext)
  },
  performBatch: async (request, { settings, audienceSettings, payload, statsContext }) => {
    return await handleUpdate(request, settings, audienceSettings, payload, statsContext)
  }
}

export default action
