import { DestinationDefinition, defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'

import sendRevxPing from './sendRevxPing'

const destination: DestinationDefinition<Settings> = {
  name: 'RevX Cloud (Actions)',
  slug: 'actions-revx',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {
      client_id: {
        label: 'Revx Client ID',
        description: 'Revx specific client id. This can be found by contacting the RevX support team',
        type: 'string',
        required: true
      }
    }
  },
  presets: [
    {
      name: 'Send Revx Ping',
      subscribe: 'type = "track" or type ="screen"',
      partnerAction: 'sendRevxPing',
      mapping: defaultValues(sendRevxPing.fields),
      type: 'automatic'
    }
  ],
  actions: {
    sendRevxPing
  }
}

export default destination
