import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import postJSON from './postJSON'

const destination: DestinationDefinition<Settings> = {
  name: 'Webhook',
  slug: 'webhook',
  mode: 'cloud',
  actions: {
    postJSON
  }
}

export default destination
