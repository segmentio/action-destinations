import btoa from 'btoa-lite'

import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import alias from './alias'
import group from './group'
import identify from './identify'
import page from './page'
import track from './track'

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
        default: 'https://core-backend-dot-staging-365112.ey.r.appspot.com/api',
        required: true
      } // FIXME: change to prod url when done with PR
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
  }
}

export default destination
