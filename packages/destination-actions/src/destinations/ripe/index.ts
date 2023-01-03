import btoa from 'btoa-lite'

import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import alias from './alias'
import group from './group'
import identify from './identify'
import page from './page'
import track from './track'
import { defaultValues } from '@segment/actions-core'

const destination: DestinationDefinition<Settings> = {
  name: 'Ripe Cloud Mode (Actions)',
  slug: 'actions-ripe-cloud',
  mode: 'cloud',

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
        label: 'API endpoint',
        description: 'Your Ripe API endpoint',
        type: 'string',
        format: 'uri',
        default: 'https://core-backend-dot-production-365112.ey.r.appspot.com/api',
        required: true
      }
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
    alias,
    group,
    identify,
    page,
    track
  },

  presets: [
    {
      name: 'Alias user',
      subscribe: 'type = "alias"',
      partnerAction: 'alias',
      mapping: defaultValues(alias.fields)
    },
    {
      name: 'Group user',
      subscribe: 'type = "group"',
      partnerAction: 'group',
      mapping: defaultValues(group.fields)
    },
    {
      name: 'Identify user',
      subscribe: 'type = "identify"',
      partnerAction: 'identify',
      mapping: defaultValues(identify.fields)
    },
    {
      name: 'Page view',
      subscribe: 'type = "page"',
      partnerAction: 'page',
      mapping: defaultValues(page.fields)
    },
    {
      name: 'Track event',
      subscribe: 'type = "track"',
      partnerAction: 'track',
      mapping: defaultValues(track.fields)
    }
  ]
}

export default destination
