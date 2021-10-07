import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import trackCustomer from './trackCustomer'

export const trackUrl = 'https://public.fbot-sandbox.me/track/'

const uuidRegex = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/

function isUuid(s: string) {
  return uuidRegex.test(s)
}

const destination: DestinationDefinition<Settings> = {
  name: 'Friendbuy',
  slug: 'friendbuy',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      merchantId: {
        label: 'Merchant ID',
        description: 'Your Friendbuy Merchant ID.',
        type: 'string',
        format: 'uuid',
        required: true
      }
    },
    testAuthentication: (_request, { settings }) => {
      if (!isUuid(settings.merchantId)) {
        throw new Error('bad merchantId')
      }
    }
  },

  actions: {
    trackCustomer
  }
}

export default destination
