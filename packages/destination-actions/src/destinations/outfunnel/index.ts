import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import identifyContact from './identifyContact'
import groupIdentifyContact from './groupIdentifyContact';
import trackEvent from './trackEvent'

const destination: DestinationDefinition<Settings> = {
  name: 'Outfunnel',
  slug: 'outfunnel',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      userId: {
        label: 'Outfunnel User Id',
        description: 'Outfunnel User ID. This is found under Account',
        type: 'string',
        required: true
      },
      apiToken: {
        label: 'API Token',
        description: 'Outfunnel API Token. This is found under Account',
        type: 'string',
        required: true
      }
    },
    testAuthentication: async (request) => {
      try {
        return await request('https://api-pls.outfunnel.com/v1/user')
      } catch (error) {
        throw new Error('Test authentication failed')
      }
    }
  },

  extendRequest({ settings }) {
    return {
      searchParams: {
        api_token: settings.apiToken
      }
    }
  },

  actions: {
    trackEvent,
    groupIdentifyContact,
    identifyContact
  }
}

export default destination
