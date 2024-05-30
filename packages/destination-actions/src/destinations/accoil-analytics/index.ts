import { defaultValues, DestinationDefinition } from '@segment/actions-core'
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
        description: 'Your Accoil.com API Key. You can find your API Key in your Accoil.com account settings.',
        type: 'password',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      const AUTH_KEY = Buffer.from(`${settings.api_key}:`).toString('base64')
      return await request(`https://in.accoil.com/segment`, {
        method: 'post',
        headers: {
          Authorization: `Basic ${AUTH_KEY}`
        },
        json: {}
      })
    }
  },
  presets: [
    {
      name: 'Track Calls',
      subscribe: 'type = "track"',
      partnerAction: 'postToAccoil',
      mapping: defaultValues(postToAccoil.fields),
      type: 'automatic'
    },
    {
      name: 'Page Calls',
      subscribe: 'type = "page"',
      partnerAction: 'postToAccoil',
      mapping: defaultValues(postToAccoil.fields),
      type: 'automatic'
    },
    {
      name: 'Screen Calls',
      subscribe: 'type = "screen"',
      partnerAction: 'postToAccoil',
      mapping: defaultValues(postToAccoil.fields),
      type: 'automatic'
    },
    {
      name: 'Identify Calls',
      subscribe: 'type = "identify"',
      partnerAction: 'postToAccoil',
      mapping: defaultValues(postToAccoil.fields),
      type: 'automatic'
    },
    {
      name: 'Group Calls',
      subscribe: 'type = "group"',
      partnerAction: 'postToAccoil',
      mapping: defaultValues(postToAccoil.fields),
      type: 'automatic'
    }
  ],
  extendRequest: ({ settings }) => {
    const AUTH_KEY = Buffer.from(`${settings.api_key}:`).toString('base64')
    return {
      headers: {
        Authorization: `Basic ${AUTH_KEY}`
      }
    }
  },
  actions: {
    postToAccoil
  }
}

export default destination
