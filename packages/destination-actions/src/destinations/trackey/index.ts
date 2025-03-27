import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import identify from './identify'
import track from './track'
import group from './group'

const destination: DestinationDefinition<Settings> = {
  name: 'Trackey',
  slug: 'actions-trackey',
  mode: 'cloud',
  description: 'Send Segment events to Trackey',
  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Your Trackey API Key',
        type: 'string',
        required: true
      }
    }
  },
  extendRequest: ({ settings }) => {
    return {
      headers: {
        api_key: settings.apiKey,
        'Content-Type': 'application/json'
      }
    }
  },
  actions: {
    identify,
    track,
    group
  }
}

export default destination
