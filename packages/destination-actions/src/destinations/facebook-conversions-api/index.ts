import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import purchase from './purchase'
import initiateCheckout from './initiateCheckout'
import addToCart from './addToCart'
import viewContent from './viewContent'
import search from './search'
import pageView from './pageView'
import custom from './custom'
import addToCart2 from './addToCart2'
import pageView2 from './pageView2'
import purchase2 from './purchase2'
import custom2 from './custom2'
import viewContent2 from './viewContent2'
import initiateCheckout2 from './initiateCheckout2'
import search2 from './search2'

const destination: DestinationDefinition<Settings> = {
  name: 'Facebook Conversions API (Actions)',
  slug: 'actions-facebook-conversions-api',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      pixelId: {
        label: 'Pixel ID',
        description:
          'Your Facebook Pixel ID. Note: You may also use a dataset ID here if you have configured a dataset in your Facebook Events Manager.',
        type: 'string',
        required: true
      },
      testEventCode: {
        label: 'Test Event Code',
        type: 'string',
        description:
          'Use this field to specify that events should be test events rather than actual traffic. You can find your Test Event Code in your Facebook Events Manager under the "Test events" tab. This can be overridden by the Test Event Code defined in the mapping. You\'ll want to remove your Test Event Code when sending real traffic through this integration.',
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
    custom,
    search2,
    viewContent2,
    initiateCheckout2,
    addToCart2,
    pageView2,
    purchase2,
    custom2
  }
}

export default destination
