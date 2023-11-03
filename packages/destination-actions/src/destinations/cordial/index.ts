import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import createContactactivity from './createContactactivity'
import upsertContact from './upsertContact'
import addContactToList from './addContactToList'
import removeContactFromList from './removeContactFromList'
import addProductToCart from './addProductToCart'
import removeProductFromCart from './removeProductFromCart'
import upsertOrder from './upsertOrder'

import mergeContacts from './mergeContacts'

const destination: DestinationDefinition<Settings> = {
  name: 'Cordial (Actions)',
  description: 'Sync Segment Users, Groups and Events to Cordial',
  slug: 'actions-cordial',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Your Cordial API Key',
        type: 'string',
        required: true
      },
      endpoint: {
        label: 'Endpoint',
        description:
          "Cordial API endpoint. Leave default, unless you've been provided with another one. [See more details](https://support.cordial.com/hc/en-us/sections/200553578-REST-API-Introduction-and-Overview)",
        type: 'string',
        required: true,
        format: 'uri',
        default: 'https://integrations-ingest-svc.usw1.cordial.com'
      },
      segmentIdKey: {
        label: 'User ID attribute key',
        description: 'Cordial string unique attribute key to store Segment User ID in (e.g. `segment_id`)',
        type: 'string',
        required: false
      }
    },
    testAuthentication: (request, { settings }) => {
      return request(settings.endpoint + '/api/checkAuth', { headers: { 'Content-Type': 'application/json' } })
    }
  },

  extendRequest({ settings }) {
    return {
      headers: { 'x-api-key': `${settings.apiKey}`, 'Accept': 'application/json'}
    }
  },

  actions: {
    createContactactivity,
    upsertContact,
    addContactToList,
    removeContactFromList,
    addProductToCart,
    removeProductFromCart,
    upsertOrder,
    mergeContacts
  }
}

export default destination
