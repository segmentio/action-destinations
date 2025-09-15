import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import syncAudience from './syncAudience'

import syncTraits from './syncTraits'

const destination: DestinationDefinition<Settings> = {
  name: 'Kevel UserDB (Actions)',
  slug: 'actions-kevel',
  description:
    'Send Segment user profiles and Audiences to Kevel UserDB for campaign targeting. Only users with a Segment userId will be synced.',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      networkId: {
        label: 'Kevel Network ID',
        description: 'Your Kevel Network ID',
        type: 'string',
        required: true
      },
      apiKey: {
        label: 'Kevel API Key',
        description: 'Your Kevel API Key',
        type: 'string',
        required: true
      }
    }
  },
  extendRequest({ settings }) {
    return {
      headers: {
        'X-Adzerk-ApiKey': settings.apiKey,
        'Content-Type': 'application/json',
        'X-Adzerk-Sdk-Version': 'adzerk-segment-integration:v1.0'
      }
    }
  },
  actions: {
    syncAudience,
    syncTraits
  }
}

export default destination
