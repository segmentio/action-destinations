import { DestinationDefinition, defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'

import send from './send'

const destination: DestinationDefinition<Settings> = {
  name: 'Equals',
  slug: 'actions-equals',
  mode: 'cloud',
  description: 'Send Segment analytics data to Equals.',

  authentication: {
    scheme: 'custom',
    fields: {
      url: {
        label: 'Equals URL',
        description: 'Equals URL to send data to.',
        type: 'string',
        required: true
      }
    }
  },
  presets: [
    {
      name: 'Send',
      subscribe: 'type = track or type = page or type = screen or type = identify or type = group',
      partnerAction: 'send',
      mapping: defaultValues(send.fields),
      type: 'automatic'
    }
  ],
  actions: {
    send
  }
}

export default destination
