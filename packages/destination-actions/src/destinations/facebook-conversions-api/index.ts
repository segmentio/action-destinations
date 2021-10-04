import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import purchase from './purchase'
import initiateCheckout from './initiateCheckout'
import addToCart from './addToCart'
import viewContent from './viewContent'
import search from './search'
import pageView from './pageView'
import { API_VERSION } from './constants'

import custom from './custom'

const destination: DestinationDefinition<Settings> = {
  name: 'Facebook Conversions API',
  slug: 'facebook-conversions-api',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      pixelId: {
        label: 'Pixel ID',
        description: 'The Pixel ID',
        type: 'string',
        required: true
      },
      token: {
        label: 'Access Token (Testing only, not in final destination)',
        description: 'Access Token',
        type: 'string'
      }
    },
    testAuthentication: async (request, { settings }) => {
      const res = await request(
        `https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}/events?access_token=${settings.token}`,
        {
          method: 'GET'
        }
      )
      return res.status === 200
    }
  },
  actions: {
    purchase,
    initiateCheckout,
    addToCart,
    viewContent,
    search,
    pageView,
    custom
  }
}

export default destination
