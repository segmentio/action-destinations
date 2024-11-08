import type { DestinationDefinition } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'

import trackEvent from './trackEvent'

const destination: DestinationDefinition<Settings> = {
  name: 'Optimizely Web (Actions)',
  slug: 'actions-optimizely-web',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      optimizelyApiKey: {
        label: 'Optimizely API Key',
        description: 'Your Optimizely API Key. TODO: Provide link to instructions on how to get this.',
        type: 'password',
        required: true
      },
      optimizelyAccountId: {
        label: 'Optimizely Account ID',
        description: 'Your Optimizely Account ID. TODO: Provide link to instructions on how to get this.',
        type: 'string',
        required: true
      },
      projectID: {
        label: 'Optimizely Project ID',
        description: 'The unique numeric identifier for the project.',
        type: 'number',
        required: true
      }
    }
  },
  presets: [
    {
      name: 'Send Custom Event or Page Event',
      subscribe: 'type = "track" or type = "page"',
      partnerAction: 'trackEvent',
      mapping: defaultValues(trackEvent.fields),
      type: 'automatic'
    }
  ],
  actions: {
    trackEvent
  }
}

export default destination
