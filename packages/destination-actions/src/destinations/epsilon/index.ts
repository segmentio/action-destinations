import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import sendEvent from './sendEvent'

const destination: DestinationDefinition<Settings> = {
  name: 'Epsilon (Actions)',
  slug: 'actions-epsilon',
  mode: 'cloud',
  description: 'Sync analytics events and user profile details to Epsilon',

  authentication: {
    scheme: 'basic',
    fields: {
      username: {
        label: 'Username',
        description: 'Your Epsilon username',
        type: 'string',
        required: true
      },
      password: {
        label: 'password',
        description: 'Your Epsilon password.',
        type: 'string',
        required: true
      },
      dtm_cid: {
        label: 'Company ID',
        description: 'Your Company ID. Contact Epsilon support for assistance.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request) => {
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
    }
  },
  extendRequest({ settings }) {
    return {
      username: settings.username,
      password: settings.password
    }
  },
  actions: {
    sendEvent
  },
  presets: [
    {
      name: 'First App Open/App Download',
      subscribe: 'event = "Application Installed"',
      partnerAction: 'sendEvent',
      mapping: { 
        ...defaultValues(sendEvent.fields),
        dtm_event: 'firstOpen',
      },
      type: 'automatic'
    },
    {
      name: 'App Open',
      subscribe: 'event = "Application Opened"',
      partnerAction: 'sendEvent',
            mapping: { 
        ...defaultValues(sendEvent.fields),
        dtm_event: 'appOpen',
      },
      type: 'automatic'
    },
    {
      name: 'Sign in/Create Account',
      subscribe: 'event = "Signed In"',
      partnerAction: 'sendEvent',
            mapping: { 
        ...defaultValues(sendEvent.fields),
        dtm_event: 'signIn',
      },
      type: 'automatic'
    },
    {
      name: 'Add to Saved List',
      subscribe: 'event = "Product Added To Wishlist"',
      partnerAction: 'sendEvent',
            mapping: { 
        ...defaultValues(sendEvent.fields),
        dtm_event: 'addSavedList',
      },
      type: 'automatic'
    },
    {
      name: 'Add to Cart',
      subscribe: 'event = "Product Added"',
      partnerAction: 'sendEvent',
            mapping: { 
        ...defaultValues(sendEvent.fields),
        dtm_event: 'cart',
      },
      type: 'automatic'
    },
    {
      name: 'Transaction Complete',
      subscribe: 'event = "Order Completed"',
      partnerAction: 'sendEvent',
            mapping: { 
        ...defaultValues(sendEvent.fields),
        dtm_event: 'conversion',
      },
      type: 'automatic'
    }
  ]
}

export default destination
