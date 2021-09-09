import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import purchase from './purchase'
import initiateCheckout from './initiateCheckout'
import addToCart from './addToCart'
import viewContent from './viewContent'
import search from './search'
import pageView from './pageView'

const destination: DestinationDefinition<Settings> = {
  name: 'Actions Facebook Conversions',
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
      }
    }
  },
  actions: {
    purchase,
    initiateCheckout,
    addToCart,
    viewContent,
    search,
    pageView
  }
}

export default destination
