import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import track from './track'
import page from './page'

const destination: DestinationDefinition<Settings> = {
  name: 'Podscribe',
  slug: 'actions-podscribe',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      advertiser: {
        label: 'Advertiser',
        description: 'Podscribe advertiser lookup key',
        type: 'string',
        required: true
      }
    }
  },

  actions: {
    track,
    page
  }
}

export default destination
