import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import send from './send'

const destination: DestinationDefinition<Settings> = {
  name: 'Webhooks (Actions)',
  slug: 'actions-webhook',
  mode: 'cloud',
  actions: {
    send
  }
}

export default destination
