import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import syncAudience from './syncAudience'
import { getHost } from './utils'

const destination: DestinationDefinition<Settings> = {
  name: 'Optimizely Advanced Audience Targeting',
  slug: 'actions-optimizely-advanced-audience-targeting',
  mode: 'cloud',
  description: 'Sync Segment Engage Audiences to Optimizely Data Platform',

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
        description: 'The Optimizely Region to sync Audience data to. Default is US',
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
      const host = getHost(settings)

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
    syncAudience
  }
}

export default destination
