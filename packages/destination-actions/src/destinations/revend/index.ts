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

const destination: DestinationDefinition<Settings> = {
  // NOTE: We need to match the name with the creation name in DB.
  // This is not the value used in the UI.
  name: 'Revend Actions',
  slug: 'revend-actions',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {
      apiSecret: {
        label: 'API Secret',
        description: 'An API SECRET generated for endpoint usage',
        type: 'string',
        required: true
      }
    }
  },
  extendRequest({ settings }) {
    return {
      headers: {
        token: settings.apiSecret
      }
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
