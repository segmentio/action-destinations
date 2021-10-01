import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import { CURRENCY_ISO_CODES } from '../constants'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Generate Lead',
  description: 'Send generate lead events to GA4.',
  defaultSubscription: 'type = "track"',
  fields: {
    client_id: {
      label: 'Client ID',
      description: 'Uniquely identifies a user instance of a web client.',
      type: 'string',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      }
    },
    currency: {
      label: 'Currency',
      type: 'string',
      description: 'Currency of the items associated with the event, in 3-letter ISO 4217 format.'
    },
    value: {
      label: 'Value',
      type: 'number',
      description: 'The monetary value of the event.'
    }
  },
  perform: (request, { payload }) => {
    if (payload.currency && !CURRENCY_ISO_CODES.includes(payload.currency)) {
      throw new IntegrationError(`${payload.currency} is not a valid currency code.`, 'Incorrect value format', 400)
    }

    // Google requires that currency be included at the event level if value is included.
    if (payload.value && payload.currency === undefined) {
      throw new IntegrationError('Currency is required if value is set.', 'Misconfigured required field', 400)
    }

    return request('https://www.google-analytics.com/mp/collect', {
      method: 'POST',
      json: {
        client_id: payload.client_id,
        events: [
          {
            name: 'generate_lead',
            params: {
              currency: payload.currency,
              value: payload.value
            }
          }
        ]
      }
    })
  }
}

export default action
