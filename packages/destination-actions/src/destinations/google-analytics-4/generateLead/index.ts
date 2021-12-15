import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import { CURRENCY_ISO_CODES } from '../constants'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { client_id, currency, value } from '../ga4-properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Generate Lead',
  description: 'Send event when a user submits a form or request for information',
  defaultSubscription: 'type = "track"',
  fields: {
    client_id: { ...client_id },
    currency: { ...currency },
    value: { ...value }
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
