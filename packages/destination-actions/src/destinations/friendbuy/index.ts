import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

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
        required: true
      }
    },
    testAuthentication: (_request, { settings }) => {
      if (!isUuid(settings.merchantId)) {
        throw new Error('bad merchantId')
      }
    }
  },

  actions: {}
}

export default destination
