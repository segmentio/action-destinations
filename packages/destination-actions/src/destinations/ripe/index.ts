import btoa from 'btoa-lite'

import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import group from './group'
import identify from './identify'
import page from './page'
import track from './track'
import { defaultValues } from '@segment/actions-core'

const destination: DestinationDefinition<Settings> = {
  name: 'Ripe Cloud Mode (Actions)',
  slug: 'actions-ripe-cloud',
  mode: 'cloud',
  description: 'Send server-side events to the Ripe REST API.',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'The Ripe API key found in the Ripe App',
        type: 'string',
        required: true
      },
      endpoint: {
        label: 'API Endpoint',
        description: `The Ripe API endpoint (do not change this unless you know what you're doing)`,
        type: 'string',
        format: 'uri',
        default: 'https://api.getripe.com/core-backend'
      }
    },

    testAuthentication: async (request, { settings }) => {
      const res = await request(`${settings.endpoint}/auth/sdk`, {
        method: 'get'
      })
      return res.status == 200
    }
  },

  extendRequest({ settings }) {
    return {
      headers: {
        Authorization: `Basic ${btoa(settings.apiKey)}`,
        'Content-Type': 'application/json'
      }
    }
  },

  actions: {
    group,
    identify,
    page,
    track
  },

  presets: [
    {
      name: 'Group user',
      subscribe: 'type = "group"',
      partnerAction: 'group',
      mapping: defaultValues(group.fields),
      type: 'automatic'
    },
    {
      name: 'Identify user',
      subscribe: 'type = "identify"',
      partnerAction: 'identify',
      mapping: defaultValues(identify.fields),
      type: 'automatic'
    },
    {
      name: 'Page view',
      subscribe: 'type = "page"',
      partnerAction: 'page',
      mapping: defaultValues(page.fields),
      type: 'automatic'
    },
    {
      name: 'Track event',
      subscribe: 'type = "track"',
      partnerAction: 'track',
      mapping: defaultValues(track.fields),
      type: 'automatic'
    }
  ]
}

export default destination
