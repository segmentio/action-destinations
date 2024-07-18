import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { defaultValues } from '@segment/actions-core'
import trackOrderPlaced from './trackOrderPlaced'

const destination: DestinationDefinition<Settings> = {
  name: 'Voyage',
  slug: 'actions-voyage',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description:
          'Voyage API key. You can create a new API key or find your existing API key in the Advanced section of your [Settings page](https://app.voyagetext.com/dashboard/settings/advanced).',
        type: 'string',
        required: true
      }
    }
  },

  extendRequest: ({ settings }) => {
    return {
      headers: {
        'x-api-key': settings.apiKey
      }
    }
  },

  presets: [
    {
      name: 'Track Order Placed Event',
      subscribe: 'type = "track"',
      partnerAction: 'trackOrderPlaced',
      mapping: defaultValues(trackOrderPlaced.fields),
      type: 'automatic'
    }
  ],

  actions: {
    trackOrderPlaced
  }
}

export default destination
