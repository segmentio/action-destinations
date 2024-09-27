import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import identify from './identify'

import track from './track'

import group from './group'

import page from './page'

import screen from './screen'
import { endpointApiKey, endpointUrl } from './utils'

const destination: DestinationDefinition<Settings> = {
  name: 'Accoil Analytics',
  slug: 'actions-accoil-analytics',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      api_key: {
        label: 'API Key',
        description: 'Your Accoil.com API Key. You can find your API Key in your Accoil account settings.',
        type: 'password',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      return await request(endpointUrl(settings.api_key), { method: 'post', json: {} })
    }
  },
  presets: [
    {
      name: 'Track Calls',
      subscribe: 'type = "track"',
      partnerAction: 'track',
      mapping: defaultValues(track.fields),
      type: 'automatic'
    },
    {
      name: 'Page Calls',
      subscribe: 'type = "page"',
      partnerAction: 'page',
      mapping: defaultValues(page.fields),
      type: 'automatic'
    },
    {
      name: 'Screen Calls',
      subscribe: 'type = "screen"',
      partnerAction: 'screen',
      mapping: defaultValues(screen.fields),
      type: 'automatic'
    },
    {
      name: 'Identify Calls',
      subscribe: 'type = "identify"',
      partnerAction: 'identify',
      mapping: defaultValues(identify.fields),
      type: 'automatic'
    },
    {
      name: 'Group Calls',
      subscribe: 'type = "group"',
      partnerAction: 'group',
      mapping: defaultValues(group.fields),
      type: 'automatic'
    }
  ],
  extendRequest: ({ settings }) => {
    const apiKey = endpointApiKey(settings.api_key)
    const AUTH_KEY = Buffer.from(`${apiKey}:`).toString('base64')
    return {
      headers: {
        Authorization: `Basic ${AUTH_KEY}`
      }
    }
  },
  actions: {
    identify,
    track,
    group,
    page,
    screen
  }
}

export default destination
