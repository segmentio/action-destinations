import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import trackEvent from './trackEvent'
import identifyUser from './identifyUser'

const destination: DestinationDefinition<Settings> = {
  name: 'Nudge (Actions)',
  slug: 'actions-nudge',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {
      apikey: {
        label: 'API Key',
        description: 'Private Backend API Key',
        type: 'string',
        required: true
      }
    }
  },

  presets: [],
  actions: {
    trackEvent,
    identifyUser
  }
}

export default destination
