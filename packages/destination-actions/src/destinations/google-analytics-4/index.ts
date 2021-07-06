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

const destination: DestinationDefinition<Settings> = {
  name: 'Google Analytics 4',
  authentication: {
    scheme: 'custom',
    fields: {
      measurementId: {
        label: 'Measurement ID',
        description:
          'The measurement ID associated with a stream. Found in the Google Analytics UI under: Admin > Data Streams > choose your stream > Measurement ID',
        type: 'string',
        required: true
      },
      apiSecret: {
        label: 'API Secret',
        description:
          'An API SECRET generated in the Google Analytics UI, navigate to: Admin > Data Streams > choose your stream > Measurement Protocol > Create',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (_request) => {
      // Return a request that tests/validates the user's authentication fields here
      // TODO: maybe run a post to the google measurements protocol debug endpoint
      return true
    }
  },
  extendRequest({ settings }) {
    return {
      searchParams: {
        measurement_id: settings.measurementId,
        api_secret: settings.apiSecret
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
    viewItem
  }
}

export default destination
