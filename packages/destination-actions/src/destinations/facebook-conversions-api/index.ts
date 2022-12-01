import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import purchase from './purchase'
import initiateCheckout from './initiateCheckout'
import addToCart from './addToCart'
import viewContent from './viewContent'
import search from './search'
import pageView from './pageView'
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
      },
      testEventCode: {
        label: 'Test Event Code',
        type: 'string',
        description:
          'Use this field to specify that events should be test events rather than actual traffic. You can find your Test Event Code in your Facebook Events Manager under the "Test events" tab. You\'ll want to remove your Test Event Code when sending real traffic through this integration.',
        required: false
      }
    }
  },
  extendRequest: () => {
    return {
      headers: { authorization: `Bearer ${process.env.ACTIONS_FB_CAPI_SYSTEM_USER_TOKEN}` }
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
