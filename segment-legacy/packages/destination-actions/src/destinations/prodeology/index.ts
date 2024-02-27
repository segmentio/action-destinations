import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { defaultValues } from '@segment/actions-core'
import track from './track'
import page from './page'
import identify from './identify'
import group from './group'

const presets: DestinationDefinition['presets'] = [
  {
    name: 'Track Calls',
    subscribe: 'type = "track"',
    partnerAction: 'track',
    mapping: defaultValues(track.fields),
    type: 'automatic'
  },
  {
    name: 'Page Calls',
    subscribe: 'type = "page"',
    partnerAction: 'page',
    mapping: defaultValues(page.fields),
    type: 'automatic'
  },
  {
    name: 'Identify Calls',
    subscribe: 'type = "identify"',
    partnerAction: 'identify',
    mapping: defaultValues(identify.fields),
    type: 'automatic'
  },
  {
    name: 'Group Calls',
    subscribe: 'type = "group"',
    partnerAction: 'group',
    mapping: defaultValues(group.fields),
    type: 'automatic'
  }
]

const destination: DestinationDefinition<Settings> = {
  name: 'Prodeology',
  slug: 'actions-prodeology',
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
        description: 'Your Prodeology API Key',
        type: 'password',
        required: true
      }
    },
    testAuthentication: (request) => {
      return request('https://api-dev.prodeology.com/api/v1/event-collection/validate-api-key', { method: 'GET' })
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
