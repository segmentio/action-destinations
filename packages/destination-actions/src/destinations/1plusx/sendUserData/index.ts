import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import mapValues from 'lodash/mapValues'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send User Data',
  description: 'Send user data to 1plusX',
  defaultSubscription: 'type = "identify"',
  fields: {
    //A user identifier must be in the form IDSPACE:ID, i.e. idfa:6D92078A-8246-4BA4-AE5B-76104861E7DC
    ope_user_id: {
      label: 'User ID',
      description: "The user's unique identifier, prefixed with the identifier type",
      type: 'string',
      required: true,
      default: {
        '@template': 'ANONYMOUSID:{{anonymousId}}'
      }
    },
    //TBD what we name this event for identify calls
    ope_event_type: {
      label: 'Event Name',
      description: 'A description of the event',
      type: 'string',
      required: true,
      default: 'User Identified'
    },
    //Must also be in the form IDSPACE:ID and multiple should be separated by a comma
    ope_alt_user_ids: {
      label: 'Alternative User IDs',
      description:
        'Alternative user ids if there is more than one identifier available, each prefixed with the identifier type and separated by commas',
      type: 'string',
      multiple: true
    },
    //Highly recommended to include
    ope_item_uri: {
      label: 'Website URL',
      description: 'The website URL of the page',
      type: 'string',
      default: {
        '@path': '$.context.page.url'
      }
    },
    ope_app_version: {
      label: 'Mobile App Version',
      description: 'Version of the mobile app',
      type: 'string',
      default: {
        '@path': '$.context.app.version'
      }
    },
    //The field should contain milliseconds since the Unix epoch
    //Optional to override the time recorded by 1plusX's API upon receipt
    ope_event_time_ms: {
      label: 'Event Timestamp',
      description:
        'Time of when the actual event happened. If not set, timestamp recorded by 1plusX upon receipt is used.',
      type: 'string',
      default: {
        '@path': '$.timestamp'
      }
    },
    ope_user_agent: {
      label: 'Browser UserAgent',
      description: 'The user agent as submitted by the browser',
      type: 'string',
      default: {
        '@path': '$.context.userAgent'
      }
    },
    gdpr: {
      label: 'GDPR Consent Flag',
      description: 'Set to 1 if subject to GDPR, set to 0 or leave blank if not subject to GDPR',
      type: 'integer'
    },
    gdpr_consent: {
      label: 'GDPR Consent String',
      description: 'If subject to GDPR, populate with appropriate consents',
      type: 'string'
    },
    ope_usp_string: {
      label: 'US Privacy Consent String',
      description:
        'If subject to CCPA, this field should be populated with appropriate consents. 1plusX will parse the string value and process the event only when the consent indicates no optout from sales. Leave blank or set to 1--- if not subject to CCPA.',
      type: 'string'
    },
    //This is a custom attribute but Fox wants us to explicitly ask for a mapping so they remember to send this
    platform: {
      label: 'Platform',
      description: 'The platform that data is originating from',
      type: 'string'
    },
    //To be updated with object data type - in the meantime, all traits are sent as top-level k:v pairs below
    custom_fields: {
      label: 'Custom Fields',
      description: 'Custom fields to include with the event',
      type: 'object',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (request, { settings, payload }) => {
    //Create cleanPayload with custom_fields removed as these must be unnested
    const { custom_fields, ...cleanPayload } = payload

    //Convert custom_field values to strings as per 1plusX requirements
    const cleanTraits = mapValues(custom_fields, function (value) {
      //Drop arrays and objects
      if (typeof value === 'object') return
      //Pass strings straight through
      else if (typeof value === 'string') return value
      //Otherwise stringify all other data types
      else return JSON.stringify(value)
    })

    const endpoint = settings.use_test_endpoint
      ? `https://tagger-test.opecloud.com/${settings.client_id}/v2/native/event`
      : `https://tagger.opecloud.com/${settings.client_id}/v2/native/event`

    return request(endpoint, {
      method: 'post',
      json: {
        ...cleanPayload,
        ...cleanTraits
      }
    })
  }
}
export default action
