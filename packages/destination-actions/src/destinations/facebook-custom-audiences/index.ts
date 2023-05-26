import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import syncEngage from './syncEngage'

import syncRetl from './syncRetl'

const destination: DestinationDefinition<Settings> = {
  name: 'Facebook Custom Audiences (Actions)',
  slug: 'actions-facebook-custom-audiences',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {},
    refreshAccessToken: async () => {
      return { accessToken: 'TODO: Implement this' }
    }
  },
  actions: {
    syncEngage,
    syncRetl
  }
}

export default destination
