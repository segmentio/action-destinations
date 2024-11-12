import type { DestinationDefinition, RequestClient } from '@segment/actions-core'
import type { Settings } from './generated-types'

import identify from './identify'
import view from './view'
import lead from './lead'
import product from './product'
import addToCart from './addToCart'
import checkout from './checkout'
import code from './code'
import purchase from './purchase'
import install from './install'
import thirdPartyEvent from './thirdPartyEvent'

const destination: DestinationDefinition<Settings> = {
  name: 'Magellan AI (Actions)',
  slug: 'actions-magellan-ai',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      pixelToken: {
        label: 'Pixel token',
        description: 'Unique identifier for the web pixel on whose behalf the event is being sent; 32 hex digits',
        type: 'string',
        required: true
      },
      apiToken: {
        label: 'API token',
        description: 'Required in order to pass GDPR deletion requests to Magellan AI',
        type: 'string',
        required: false
      }
    }
  },

  onDelete: async (request: RequestClient, { payload, settings }) => {
    if (!settings.apiToken) return

    return request('https://api.magellan.ai/v2/gdpr/delete', {
      method: 'post',
      headers: { Authorization: `Bearer ${settings.apiToken}` },
      json: { ...payload, pixelToken: settings.pixelToken }
    })
  },

  actions: {
    identify,
    view,
    lead,
    product,
    addToCart,
    checkout,
    code,
    purchase,
    install,
    thirdPartyEvent
  }
}

export default destination
