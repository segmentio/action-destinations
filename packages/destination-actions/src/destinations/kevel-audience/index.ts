import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import syncAudience from './syncAudience'

const destination: DestinationDefinition<Settings> = {
  name: 'Kevel Audience (Actions)',
  slug: 'actions-kevel-audience',
  description:
    'Send Segment user profiles and Segment Audiences to Kevel Audience. Only users with a Segment userId will be synced.',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      audienceDomain: {
        label: 'Kevel Audience Domain',
        description: 'Your Kevel Audience Domain',
        type: 'string',
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
    syncAudience
  }
}

export default destination
