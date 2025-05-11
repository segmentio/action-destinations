import { DestinationDefinition, defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'
import trackEvent from './trackEvent'
import identify from './identify'

const destination: DestinationDefinition<Settings> = {
  name: 'Drip (Actions)',
  slug: 'actions-drip',
  mode: 'cloud',
  description: 'Send Segment analytics events and user profile details to Drip',
  authentication: {
    scheme: 'custom',
    fields: {
      accountId: {
        label: 'Account ID',
        description: 'Account ID for your Drip account. You can find this in your Drip account settings.',
        type: 'string',
        required: true
      },
      apiKey: {
        label: 'API Key',
        description: 'API key for your Drip account. You can find this in your Drip account settings.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request) => {
      return request(`https://api.getdrip.com/v2/user`, {
        method: 'get'
      })
    }
  },
  presets: [
    {
      name: 'Identify',
      subscribe: 'type = "identify"',
      partnerAction: 'identify',
      mapping: defaultValues(identify.fields),
      type: 'automatic'
    },
    {
      name: 'Track event',
      subscribe: 'type = "track"',
      partnerAction: 'trackEvent',
      mapping: defaultValues(trackEvent.fields),
      type: 'automatic'
    }
  ],
  extendRequest({ settings }) {
    return {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${settings.apiKey}`,
        'User-Agent': 'Segment (Actions)'
      }
    }
  },

  actions: {
    trackEvent,
    identify
  }
}

export default destination
