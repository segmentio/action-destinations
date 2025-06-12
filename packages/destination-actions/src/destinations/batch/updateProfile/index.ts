import type { ActionDefinition, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { MAX_BATCH_SIZE } from './constants'
import { mapPayload } from './utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update User Profile',
  description: 'Sends user events or creates and updates user profiles in Batch.',
  defaultSubscription: 'type = "identify" or type = "track"',
  fields: {
    identifiers: {
      label: 'Identifiers',
      description: "User identifiers",
      type: 'object',
      required: true,
      properties: {
        custom_id: {
          label: 'User ID',
          description: 'The unique profile identifier',
          type: 'string',
          required: true,
          default: {
            '@path': '$.userId'
          }
        }
      }
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of attributes to include in each batch.',
      type: 'number',
      default: MAX_BATCH_SIZE,
      readOnly: true,
      unsafe_hidden: true
    },
    profileAttributes: {
      label: 'Profile attributes',
      description: "Attributes for the user profile",
      type: 'object',
      additionalProperties: true,
      properties: {
        language: {
          label: 'Language',
          description: "The profile's language. This can be sent as a locale (e.g., 'en-US') or a language code (e.g., 'en').",
          type: 'string',
          allowNull: true
        },
        email_address: {
          label: 'Email',
          description: "The profile's email",
          type: 'string',
          allowNull: true
        },
        phone_number: {
          label: 'Phone Number',
          description: "The profile's phone number",
          type: 'string',
          allowNull: true
        },
        email_marketing: {
          label: 'Email marketing subscribe',
          description:
            "The profile's marketing emails subscription. Setting to null will reset the marketing emails subscription.",
          type: 'string',
          allowNull: true,
          choices: [
            { label: 'Subscribed', value: 'subscribed' },
            { label: 'Unsubscribed', value: 'unsubscribed' }
          ]
        },
        sms_marketing: {
          label: 'SMS marketing subscribe',
          description:
            "The profile's marketing SMS subscription. Setting to 'Reset' will reset the marketing SMS subscription.",
          type: 'string',
          allowNull: true,
          choices: [
            { label: 'Subscribed', value: 'subscribed' },
            { label: 'Unsubscribed', value: 'unsubscribed' }
          ]
        },
        timezone: {
          label: 'Timezone',
          description: "The profile's time zone name from IANA Time Zone Database (e.g., “Europe/Paris”). Only valid time zone values will be set.",
          type: 'string',
          allowNull: true
        },
        region: {
          label: 'Region',
          description: "The profile's region. This can be sent as a locale (e.g., 'en-US') or a country code (e.g., 'US').",
          type: 'string',
          allowNull: true
        }
      },
      default: {
        language: { '@path': '$.context.locale' },
        email_address: {
          '@if': {
            exists: { '@path': '$.context.traits.email' },
            then: { '@path': '$.context.traits.email' },
            else: { '@path': '$.traits.email' }
          }
        },
        phone_number: {
          '@if': {
            exists: { '@path': '$.context.traits.phone' },
            then: { '@path': '$.context.traits.phone' },
            else: { '@path': '$.traits.phone' }
          }
        },
        email_marketing: {
          '@if': {
            exists: { '@path': '$.context.traits.email_marketing' },
            then: { '@path': '$.context.traits.email_marketing' },
            else: { '@path': '$.traits.email_marketing' }
          }
        },
        sms_marketing: {
          '@if': {
            exists: { '@path': '$.context.traits.sms_marketing' },
            then: { '@path': '$.context.traits.sms_marketing' },
            else: { '@path': '$.traits.sms_marketing' }
          }
        },
        timezone: {'@path': '$.traits.timezone'},
        region: {'@path': '$.context.locale'}
      }
    },
    eventName: {
      label: 'Event Name',
      description: 'The name of the event.',
      type: 'string',
      default: {
        '@path': '$.event'
      }
    },
    eventAttributes: {
      label: 'Event Attributes',
      description: "An object containining the event's attributes",
      type: 'object',
      default: {
        '@path': '$.properties'
      },
      additionalProperties: true
    }
  },
  perform: (request, {payload}) => {
    return send(request, [payload])
  },
  performBatch: (request, {payload}) => {
    return send(request, payload)
  }
}

async function  send(request: RequestClient, payload: Payload[]){
  const json = payload.map(mapPayload)
  return await request('https://api.batch.com/2.5/profiles/update', {
    method: 'post',
    json
  })
}

export default action