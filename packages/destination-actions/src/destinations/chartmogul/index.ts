import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { InvalidAuthenticationError } from '@segment/actions-core'

import sendContact from './sendContact'

import sendCustomer from './sendCustomer'

const destination: DestinationDefinition<Settings> = {
  name: 'Chart Mogul',
  slug: 'actions-chartmogul',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      chartmogul_webhook_url: {
        label: 'ChartMogul webhook URL',
        description: 'Copy the webhook URL from ChartMogul and paste it here',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request, auth) => {
      const targetUrl = auth?.settings?.chartmogul_webhook_url
      if (!targetUrl || !targetUrl.startsWith('https://')) {
        throw new InvalidAuthenticationError('Please configure the ChartMogul webhook URL.')
      }

      return request(targetUrl, {
        method: 'post',
        json: {}
      })
    }
  },

  actions: {
    sendContact,
    sendCustomer
  }
}

export default destination
