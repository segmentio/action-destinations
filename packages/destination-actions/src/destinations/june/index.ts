import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import track from './track'

import identify from './identify'

import group from './group'

import page from './page'

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
  name: 'June',
  slug: 'june',
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

  // onDelete: async (request, { settings, payload }) => {
  // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
  // provided in the payload. If your destination does not support GDPR deletion you should not
  // implement this function and should remove it completely.
  // },
}

export default destination
