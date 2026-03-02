import { DestinationDefinition, defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'
import sync from './sync'

const destination: DestinationDefinition<Settings> = {
  name: 'Youappi Audiences',
  slug: 'actions-youappi-audience',
  mode: 'cloud',
  description: 'Sync Segment Engage Audiences to Youappi',
  authentication: {
    scheme: 'custom',
    fields: {
      api_key: {
        type: 'string',
        label: 'API Key',
        description: 'Your Youappi API key.',
        required: true
      }
    }
  },
  extendRequest() {
    return {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  },
  actions: {
    sync
  },
  presets: [
    {
      name: 'Sync Engage Audience',
      subscribe: 'type = "identify" or type = "track"',
      partnerAction: 'sync',
      mapping: defaultValues(sync.fields),
      type: 'automatic'
    }
  ]
}

export default destination
