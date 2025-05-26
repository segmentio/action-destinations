import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import trackLead from './trackLead'
import trackSale from './trackSale'

const destination: DestinationDefinition<Settings> = {
  name: 'Dub (Actions)',
  slug: 'actions-dub',
  mode: 'cloud',
  description: 'Track Lead and Sale conversion events on Dub.',
  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'The API Key is available via Dub Dashboard: https://app.dub.co/settings/tokens',
        type: 'string',
        required: true
      }
    }
  },
  extendRequest({ settings }) {
    return {
      headers: {
        Authorization: `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  },
  actions: {
    trackLead,
    trackSale
  }
}

export default destination
