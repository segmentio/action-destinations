import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import { productClickPresets } from './productClickedEvents'
import productClickedEvents from './productClickedEvents'

import conversionEvents from './conversionEvents'

import productViewedEvents from './productViewedEvents'

export const ALGOLIA_INSIGHTS_USER_AGENT = 'algolia-segment-action-destination: 0.1'

const destination: DestinationDefinition<Settings> = {
  name: 'Algolia Insights',
  slug: 'actions-algolia-insights',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      appId: {
        label: 'appId',
        description: 'Your Algolia Application ID.',
        type: 'string',
        required: true
      },
      apiKey: {
        label: 'apiKey',
        description: 'An API key which has write permissions to the Algolia Insights API',
        type: 'string',
        required: true
      }
    }
  },

  extendRequest: ({ settings }) => {
    return {
      headers: {
        'X-Algolia-Application-Id': settings.appId,
        'X-Algolia-API-Key': settings.apiKey,
        'X-Algolia-Agent': ALGOLIA_INSIGHTS_USER_AGENT
      }
    }
  },
  presets: productClickPresets,
  actions: {
    productClickedEvents,
    conversionEvents,
    productViewedEvents
  }
}

export default destination
