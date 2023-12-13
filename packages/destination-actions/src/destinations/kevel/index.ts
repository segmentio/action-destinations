import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import syncAudience from './syncAudience'

import syncTraits from './syncTraits'

const destination: DestinationDefinition<Settings> = {
  name: 'Kevel',
  slug: 'actions-kevel',
  description: 'Send Segment Engage Audiences to Kevel. Note only users with a userId will be synced.',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      networkId: {
        label: 'Kevel Network ID',
        description: 'TODO',
        type: 'string',
        required: true
      },
      apiKey: {
        label: 'Keven API Key',
        description: 'TODO',
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
