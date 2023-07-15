import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import trackEvent from './trackEvent'

import identifyUser from './identifyUser'

const destination: DestinationDefinition<Settings> = {
  name: 'Rehook',
  slug: 'actions-rehook',
  mode: 'cloud',

  authentication: {
    scheme: 'basic',
    fields: {
      api_key: {
        label: 'Api Key',
        description: 'Your Rehook API Key',
        type: 'string',
        required: true
      },
      api_secret: {
        label: 'Api Secret',
        description: 'Your Rehook API Secret',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      return request(`https://api.rehook.ai/events/segment/check-auth`, {
        method: 'get',
        headers: {
          authorization: `Basic ${Buffer.from(`${settings.api_key}:${settings.api_secret}`).toString('base64')}`
        }
      })
    }
  },
  extendRequest({ settings }) {
    if (!settings.api_key || !settings.api_secret) {
      throw new Error('Missing API KEY or API SECRET')
    }

    return {
      headers: {
        authorization: `Basic ${Buffer.from(`${settings.api_key}:${settings.api_secret}`).toString('base64')}`
      }
    }
  },
  actions: {
    trackEvent,
    identifyUser
  }
}

export default destination
