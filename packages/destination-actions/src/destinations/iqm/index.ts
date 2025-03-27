import type { DestinationDefinition } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'

import postEvent from './postEvent'

export const BASE_URL = 'https://postback.iqm.com/open?pid=segment'

const destination: DestinationDefinition<Settings> = {
  name: 'Iqm',
  slug: 'actions-iqm',
  mode: 'cloud',
  description: 'Send Segment events to IQM',
  authentication: {
    scheme: 'custom',
    fields: {
      pixel_id: {
        label: 'Pixel ID',
        description: 'The Pixel ID for your IQM Conversion.',
        type: 'string',
        required: true
      }
    }
  },

  onDelete: async (request, { settings, payload }) => {
    const { pixel_id } = settings
    await request(`${BASE_URL}&pixel_id=${pixel_id}`, {
      method: 'delete',
      headers: { HOST: 'postback.iqm.com', 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  },

  actions: {
    postEvent
  },
  presets: [
    {
      name: 'Send an event to IQM',
      subscribe: 'type = "track"',
      partnerAction: 'postEvent',
      mapping: defaultValues(postEvent.fields),
      type: 'automatic'
    }
  ]
}

export default destination
