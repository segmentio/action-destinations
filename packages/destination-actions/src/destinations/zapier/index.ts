import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import send from './send'
const destination: DestinationDefinition<Settings> = {
  name: 'Zapier (Actions)',
  slug: 'actions-zapier',
  description: 'Send Segment event data to Zapier',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {}
  },
  actions: {
    send
  }
}

export default destination
