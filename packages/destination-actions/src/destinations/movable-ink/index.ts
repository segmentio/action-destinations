import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import identify from './identify'
import search from './search'
import conversion from './conversion'
import productViewed from './productViewed'

import productAdded from './productAdded'

import categoryView from './categoryView'

const destination: DestinationDefinition<Settings> = {
  name: 'Movable Ink',
  slug: 'actions-movable-ink',
  mode: 'cloud',
  description: 'Send Segment analytics events to Movable Ink',
  authentication: {
    scheme: 'basic',
    fields: {
      username: {
        label: 'Username',
        description: 'Your Movable Ink username',
        type: 'string',
        required: true
      },
      password: {
        label: 'password',
        description: 'Your Movable Ink password.',
        type: 'string',
        required: true
      },
      movableInkURL: {
        label: 'password',
        description: 'The Movable Ink URL to send data to.',
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
    identify,
    search,
    conversion,
    productViewed,
    productAdded,
    categoryView
  }
}

export default destination
