import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { SubscriberRequest } from './types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Subscribe User to Attentive',
  description: 'Send a subscription request to Attentive.',
  defaultSubscription: 'type = "identify"',
  fields: {
    userIdentifiers: {
      label: 'User Identifiers',
      description: 'At least one identifier (phone or email) is required.',
      type: 'object',
      required: true,
      additionalProperties: true,
      properties: {
        phone: {
          label: 'Phone',
          description: "The user's phone number in E.164 format.",
          type: 'string',
          required: false
        },
        email: {
          label: 'Email',
          description: "The user's email address.",
          type: 'string',
          format: 'email',
          required: false
        }
      }
    },
    subscriptionType: {
      label: 'Subscription Type',
      description: 'Type of subscription (MARKETING or TRANSACTIONAL)',
      type: 'string',
      required: true,
      default: 'MARKETING'
    },
    locale: {
      label: 'Locale',
      description: 'User locale (language and country)',
      type: 'object',
      required: false,
      properties: {
        language: {
          label: 'Language',
          type: 'string',
          required: true
        },
        country: {
          label: 'Country',
          type: 'string',
          required: true
        }
      }
    }
  },
  perform: (request, { payload, settings }) => {
    const { phone, email } = payload.userIdentifiers
    const { subscriptionType, locale } = payload
    const localeData = locale || { language: 'en', country: 'US' }

    // Validate that at least one user identifier (phone or email) is provided
    if (!phone && !email) {
      throw new PayloadValidationError('At least one user identifier (phone or email) is required.')
    }

    const requestBody: SubscriberRequest = {
      user: {
        phone,
        email
      },
      subscriptionType,
      locale: localeData
    }

    return request('https://api.attentivemobile.com/v1/subscriptions', {
      method: 'post',
      json: requestBody,
      headers: {
        Authorization: `Bearer ${settings.apiKey}`
      }
    })
  }
}

export default action
