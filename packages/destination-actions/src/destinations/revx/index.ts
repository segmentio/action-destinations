import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import sendRevxPing from './sendRevxPing'

const destination: DestinationDefinition<Settings> = {
  name: 'RevX',
  slug: 'actions-revx',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {}
  },
  actions: {
    sendRevxPing
  }
}

export default destination
