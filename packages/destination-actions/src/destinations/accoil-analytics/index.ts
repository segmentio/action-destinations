import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import postToAccoil from './postToAccoil'

const destination: DestinationDefinition<Settings> = {
  name: 'Accoil Analytics',
  slug: 'actions-accoil-analytics',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      api_key: {
        label: 'API Key',
        description:
          'Your base64 ecoded Accoil.com API Key. You can find your API Key in your Accoil.com account settings.',
        type: 'password',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      return await request(`https://in.accoil.com/segment`, {
        method: 'post',
        headers: {
          Authorization: `Basic ${Buffer.from(`${settings.api_key}:`).toString('base64')}`
        },
        json: {}
      })
    }
  },
  extendRequest: ({ settings }) => {
    return {
      headers: {
        Authorization: `Basic ${Buffer.from(`${settings.api_key}:`).toString('base64')}`
      }
    }
  },
  actions: {
    postToAccoil
  }
}

export default destination
