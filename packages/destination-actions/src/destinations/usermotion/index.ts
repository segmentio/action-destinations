import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { defaultValues } from '@segment/actions-core'

import identify from './identify'

import group from './group'

import track from './track'

const presets: DestinationDefinition['presets'] = [
  {
    name: 'Identify User',
    subscribe: 'type = "identify"',
    partnerAction: 'identify',
    mapping: defaultValues(identify.fields),
    type: 'automatic'
  },
  {
    name: 'Identify Group',
    subscribe: 'type = "group"',
    partnerAction: 'group',
    mapping: defaultValues(group.fields),
    type: 'automatic'
  },
  {
    name: 'Track Analytics Event',
    subscribe: 'type = "track" or type = "page"',
    partnerAction: 'track',
    mapping: defaultValues(track.fields),
    type: 'automatic'
  }
]

const destination: DestinationDefinition<Settings> = {
  name: 'UserMotion (Actions)',
  slug: 'actions-usermotion',
  mode: 'cloud',
  description: 'Send server-side events to the UserMotion REST API.',
  extendRequest: ({ settings }) => {
    return {
      headers: {
        'x-source': 'Segment',
        Authorization: `Basic ${settings.apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  },
  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Your UserMotion API Key',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request) => {
      return request('https://api.usermotion.com/v1/verify', { method: 'POST' })
    }
  },
  presets,
  actions: {
    identify,
    group,
    track
  }
}

export default destination
