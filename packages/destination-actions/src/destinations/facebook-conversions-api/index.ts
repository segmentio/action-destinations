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
  name: 'Facebook Conversions API (Actions)',
  slug: 'actions-facebook-conversions-api',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      pixelId: {
        label: 'Pixel ID',
        description: 'Your Facebook Pixel ID',
        type: 'string',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      const res = await request(
        `https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}/`,
        {
          method: 'GET'
        }
      )
      return res.status === 200
    },
  },
  extendRequest: () => {
    return {
      headers: { authorization: `Bearer ${process.env.ACTIONS_FB_CAPI_SYSTEM_USER_TOKEN}`}
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
