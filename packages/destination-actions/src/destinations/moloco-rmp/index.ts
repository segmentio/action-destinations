import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { authentication } from './common/auth'

import home from './home'

import search from './search'

import addToWishlist from './addToWishlist'

import itemPageView from './itemPageView'

import pageView from './pageView'

import land from './land'

import purchase from './purchase'

import addToCart from './addToCart'

const destination: DestinationDefinition<Settings> = {
  name: 'Moloco Rmp',
  slug: 'actions-moloco-rmp',
  mode: 'cloud',
  authentication,

  actions: {
    home,
    search,
    addToWishlist,
    itemPageView,
    pageView,
    land,
    purchase,
    addToCart
  }
}

export default destination
