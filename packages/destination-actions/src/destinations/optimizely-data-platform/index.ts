import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { hosts } from './utils'

import trackEvent from './trackEvent'

import upsertContact from './upsertContact'

const destination: DestinationDefinition<Settings> = {
  name: 'Optimizely Data Platform',
  slug: 'actions-optimizely-data-platform',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'Api Key',
        description: 'Api Key used for Optimizely API authorization when sending events',
        type: 'password',
        required: true
      },
      region: {
        label: 'Region',
        description: 'Optimizely Region to sync Audience data to. Default is US',
        type: 'string',
        required: true,
        choices: [
          { label: 'US', value: 'US' },
          { label: 'Europe', value: 'EU' },
          { label: 'Australia', value: 'AU' }
        ]
      }
    },
    testAuthentication: (request, { settings }) => {
      const host = hosts[settings.region]

      return request(`${host}/auth`, {
        method: 'POST'
      })
    }
  },
  extendRequest({ settings }) {
    return {
      headers: { Authorization: `Bearer ${settings.apiKey}` }
    }
  },
  actions: {
    trackEvent,
    upsertContact
  }
}

export default destination
