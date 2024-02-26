import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { authentication } from './common/auth'

import home from './home'

import search from './search'

import addToWishlist from './addToWishlist'

import itemPageView from './itemPageView'

const destination: DestinationDefinition<Settings> = {
  name: 'Moloco Rmp',
  slug: 'actions-moloco-rmp',
  mode: 'cloud',

  authentication,

  // // TODO: Consider this
  // onDelete: async (request, { settings, payload }) => {
  //   // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
  //   // provided in the payload. If your destination does not support GDPR deletion you should not
  //   // implement this function and should remove it completely.
  // },

  actions: {
    home,
    search,
    addToWishlist,
    itemPageView
  }
}

export default destination
