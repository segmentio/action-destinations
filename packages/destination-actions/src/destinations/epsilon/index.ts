import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import standardFieldsEvent from './standardFieldsEvent'

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
      siteId: {
        label: 'Site ID',
        description: 'Your Epsilon site ID. Contact Epsilon support for assistance.',
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

  onDelete: async (request, { settings, payload }) => {
    // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
    // provided in the payload. If your destination does not support GDPR deletion you should not
    // implement this function and should remove it completely.
  },
  actions: {
    standardFieldsEvent
  },
  presets: [
    {
      name: 'First Open',
      subscribe: 'type = "track" and event = "Application Installed"',
      partnerAction: 'standardFieldsEvent',
      mapping: { 
        ...defaultValues(standardFieldsEvent.fields),
        dtm_event: 'firstOpen',
      },
      type: 'automatic'
    },
    {
      name: 'App Open',
      subscribe: 'type = "track" and event = "Application Opened"',
      partnerAction: 'standardFieldsEvent',
            mapping: { 
        ...defaultValues(standardFieldsEvent.fields),
        dtm_event: 'appOpen',
      },
      type: 'automatic'
    },
    {
      name: 'Sign In',
      subscribe: 'type = "track" and event = "Signed In"',
      partnerAction: 'standardFieldsEvent',
            mapping: { 
        ...defaultValues(standardFieldsEvent.fields),
        dtm_event: 'signIn',
      },
      type: 'automatic'
    },
    {
      name: 'Find a Store',
      subscribe: 'type = "track" and event = "Store Location Searched"',
      partnerAction: 'standardFieldsEvent',
            mapping: { 
        ...defaultValues(standardFieldsEvent.fields),
        dtm_event: 'store',
      },
      type: 'automatic'
    },
    {
      name: 'Reward Signup',
      subscribe: 'type = "track" and event = "Subscribed to Rewards Program"',
      partnerAction: 'standardFieldsEvent',
            mapping: { 
        ...defaultValues(standardFieldsEvent.fields),
        dtm_event: 'rewardSignup',
      },
      type: 'automatic'
    }
  ]
}

export default destination
