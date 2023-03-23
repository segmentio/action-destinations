import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import track from './track'
import page from './page'
import identify from './identify'
import group from './group'

const presets: DestinationDefinition['presets'] = [
  {
    name: 'Track Calls',
    subscribe: 'type = "track"',
    partnerAction: 'track'
  },
  {
    name: 'Page Calls',
    subscribe: 'type = "page"',
    partnerAction: 'page'
  },
  {
    name: 'Identify Calls',
    subscribe: 'type = "identify"',
    partnerAction: 'identify'
  },
  {
    name: 'Group Calls',
    subscribe: 'type = "group"',
    partnerAction: 'group'
  }
]

const destination: DestinationDefinition<Settings> = {
  name: 'June (Actions)',
  slug: 'june-actions',
  mode: 'cloud',

  extendRequest: ({ settings }) => {
    return {
      headers: { Authorization: `Basic ${settings.apiKey}`, 'Content-Type': 'application/json' }
    }
  },

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Your June API Key',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request) => {
      return request('https://api.june.so/api/validate-write-key', { method: 'GET' })
    }
  },
  presets,
  actions: {
    track,
    identify,
    group,
    page
  }
}

export default destination
