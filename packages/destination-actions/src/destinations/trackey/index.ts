import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import identifyUser from './identify'
import trackEvent from './track'
import registerCompany from './group'

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
    identifyUser,
    trackEvent,
    registerCompany
  }
}

export default destination
