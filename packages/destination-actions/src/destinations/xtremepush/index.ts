import { DestinationDefinition, defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'

import identify from './identify'
import track from './track'

const destination: DestinationDefinition<Settings> = {
  name: 'Xtremepush (Actions)',
  slug: 'actions-xtremepush',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      url: {
        type: 'string',
        format: 'uri',
        label: 'URL',
        description: 'Xtremepush integration URL can be found on the Xtremepush integration overview page',
        required: true
      },
      apiKey: {
        type: 'string',
        label: 'API Key',
        description: 'Auth token for API can be found on the Xtremepush integration overview page',
        required: true
      }
    }
  },
  extendRequest: ({ settings }) => {
    return {
      headers: { Authorization: 'Basic ' + Buffer.from(settings.apiKey + ':').toString('base64') },
      responseType: 'json'
    }
  },
  presets: [
    {
      name: 'Send Analytics Events',
      subscribe: 'type = "track"',
      partnerAction: 'track',
      mapping: defaultValues(track.fields),
      type: 'automatic'
    },
    {
      name: 'Send User Profile Data',
      subscribe: 'type = "identify"',
      partnerAction: 'identify',
      mapping: defaultValues(identify.fields),
      type: 'automatic'
    }
  ],
  actions: {
    identify,
    track
  },
  onDelete: async (request, { settings, payload }) => {
    const host = settings.url.endsWith('/') ? settings.url.slice(0, -1) : settings.url;

    return request(host + '/api/integration/segment/delete', {
      method: 'post',
      json: payload
    })
  }
}

export default destination
