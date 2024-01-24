import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import purchase from './purchase'
import addToCart from './addToCart'
import pageView from './pageView'
import customEvent from './customEvent'
import selectItem from './selectItem'
import beginCheckout from './beginCheckout'
import selectPromotion from './selectPromotion'
import viewItem from './viewItem'
import search from './search'
import viewItemList from './viewItemList'
import signUp from './signUp'
import viewPromotion from './viewPromotion'
import viewCart from './viewCart'
import login from './login'
import generateLead from './generateLead'
import addToWishlist from './addToWishlist'
import addPaymentInfo from './addPaymentInfo'
import refund from './refund'
import removeFromCart from './removeFromCart'
import { IntegrationError } from '@segment/actions-core'

const destination: DestinationDefinition<Settings> = {
  name: 'Google Analytics 4 Cloud',
  slug: 'actions-google-analytics-4',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {
      measurementId: {
        label: 'Measurement ID',
        description:
          'The Measurement ID associated with a stream. Found in the Google Analytics UI under: Admin > Data Streams > choose your stream > Measurement ID. **Required for web streams.**',
        type: 'string',
        required: false
      },
      firebaseAppId: {
        label: 'Firebase App ID',
        description:
          'The Firebase App ID associated with the Firebase app. Found in the Firebase console under: Project Settings > General > Your Apps > App ID. **Required for mobile app streams.**',
        type: 'string',
        required: false
      },
      apiSecret: {
        label: 'API Secret',
        description:
          'An API SECRET generated in the Google Analytics UI, navigate to: Admin > Data Streams > choose your stream > Measurement Protocol > Create',
        type: 'string',
        required: true
      }
    },
    testAuthentication(_, { settings }) {
      if (!settings.firebaseAppId && !settings.measurementId) {
        throw new IntegrationError(
          'One of Firebase App ID (Mobile app Stream) or Measurement ID (Web Stream) is required',
          'Misconfigured field',
          400
        )
      }
      return {}
    }
  },
  actions: {
    purchase,
    addToCart,
    pageView,
    customEvent,
    selectItem,
    beginCheckout,
    selectPromotion,
    viewItem,
    removeFromCart,
    viewCart,
    search,
    viewItemList,
    signUp,
    viewPromotion,
    addPaymentInfo,
    refund,
    login,
    generateLead,
    addToWishlist
  }
}

export default destination
