import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import postToAccoil from './postToAccoil'
import trackEvent from '../launchpad/trackEvent'
import identifyUser from '../launchpad/identifyUser'
import groupIdentifyUser from '../launchpad/groupIdentifyUser'

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
      name: 'Track Event',
      subscribe: 'type = "track"',
      partnerAction: 'trackEvent',
      mapping: defaultValues(trackEvent.fields),
      type: 'automatic'
    },
    {
      name: 'Group',
      subscribe: 'type = "group"',
      partnerAction: 'group',
      mapping: defaultValues(groupIdentifyUser.fields),
      type: 'automatic'
    },
    {
      name: 'Identify User',
      subscribe: 'type = "identify"',
      partnerAction: 'identifyUser',
      mapping: defaultValues(identifyUser.fields),
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
