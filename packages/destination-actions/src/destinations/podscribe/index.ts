import type { Settings } from './generated-types'
import { defaultValues, DestinationDefinition } from '@segment/actions-core'

import track from './track'
import page from './page'

const presets: DestinationDefinition['presets'] = [
  {
    name: 'Order Completed Calls',
    subscribe: 'type = "track" and event = "Order Completed"',
    partnerAction: 'track',
    mapping: {
      ...defaultValues(track.fields),
      event_type: 'purchase'
    }
  },
  {
    name: 'Signed Up Calls',
    subscribe: 'type = "track" and event = "Signed Up"',
    partnerAction: 'track',
    mapping: {
      ...defaultValues(track.fields),
      event_type: 'signup'
    }
  }
]

const destination: DestinationDefinition<Settings> = {
  name: 'Podscribe (Actions)',
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
  presets,
  actions: {
    track,
    page
  }
}

export default destination
