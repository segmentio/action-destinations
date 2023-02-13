import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import { productClickedEvents, productClickPresets } from './productClickedEvents'

import { conversionEvents, conversionPresets } from './conversionEvents'

import { productViewedEvents, productViewedPresets } from './productViewedEvents'
import { AlgoliaApiPermissions, algoliaApiPermissionsUrl } from './algolia-insight-api'

export const ALGOLIA_INSIGHTS_USER_AGENT = 'algolia-segment-action-destination: 0.1'

const destination: DestinationDefinition<Settings> = {
  name: 'Algolia Insights (Actions)',
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
    },
    testAuthentication: async (request, { settings }) => {
      const response = await request<AlgoliaApiPermissions>(algoliaApiPermissionsUrl(settings))

      if (response.data.acl.indexOf('search') === -1) {
        return Promise.reject('Invalid acl permissions.')
      }

      return response
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
  // TODO: figure out how to pass multiple presets
  presets: [productClickPresets, conversionPresets, productViewedPresets],
  actions: {
    productClickedEvents,
    conversionEvents,
    productViewedEvents
  }
}

export default destination
