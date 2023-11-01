import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import identify from './identify'
import search from './search'
import conversion from './conversion'
import productViewed from './productViewed'

import productAdded from './productAdded'

import categoryView from './categoryView'

import sendCustomEvent from './sendCustomEvent'

import sendEntireEvent from './sendEntireEvent'

const destination: DestinationDefinition<Settings> = {
  name: 'Movable Ink (Actions)',
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
      movable_ink_url: {
        label: 'Movable Ink URL',
        description:
          'The Movable Ink URL to send data to. This URL can also be specified at the Action level via the "Movable Ink URL" Action field',
        type: 'string',
        required: false
      }
    }
  },
  extendRequest({ settings }) {
    return {
      username: settings.username,
      password: settings.password
    }
  },
  presets: [
    {
      name: 'Send Entire Event',
      partnerAction: 'sendEntireEvent',
      subscribe: 'type = "identify" or type = "track" or type = "page" or type = "screen"',
      mapping: defaultValues(sendEntireEvent.fields),
      type: 'automatic'
    }
  ],
  actions: {
    identify,
    search,
    conversion,
    productViewed,
    productAdded,
    categoryView,
    sendCustomEvent,
    sendEntireEvent
  }
}

export default destination
