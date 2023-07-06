import { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

const destination: DestinationDefinition<Settings> = {
  name: 'Attio',
  description: 'The Attio destination allows you to assert Records in your Attio workspace based on Segment events',
  slug: 'actions-attio',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth-managed',
    fields: {},
    testAuthentication: (request) => request('https://api.attio.com/v1/token')
  },

  extendRequest({ auth }) {
    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`
      }
    }
  },

  actions: {},

  presets: []
}

export default destination
