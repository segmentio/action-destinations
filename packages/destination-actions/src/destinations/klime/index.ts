import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import track from './track'
import identify from './identify'
import group from './group'

const destination: DestinationDefinition<Settings> = {
  name: 'Klime',
  slug: 'actions-klime',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiEndpoint: {
        label: 'API Endpoint',
        description: 'Klime API endpoint URL',
        type: 'string',
        format: 'uri',
        required: true,
        default: 'https://i.klime.com'
      },
      writeKey: {
        label: 'Write Key',
        description: 'Your Klime write key for authentication',
        type: 'password',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      return request(`${settings.apiEndpoint}/v1/batch`, {
        method: 'post',
        json: { batch: [] }
      })
    }
  },

  extendRequest({ settings }) {
    return {
      headers: {
        Authorization: `Bearer ${settings.writeKey}`,
        'Content-Type': 'application/json'
      }
    }
  },

  actions: {
    track,
    identify,
    group
  },
  presets: [
    {
      name: 'Track Event',
      subscribe: 'type = "track"',
      partnerAction: 'track',
      mapping: defaultValues(track.fields),
      type: 'automatic'
    },
    {
      name: 'Identify User',
      subscribe: 'type = "identify"',
      partnerAction: 'identify',
      mapping: defaultValues(identify.fields),
      type: 'automatic'
    },
    {
      name: 'Track Group',
      subscribe: 'type = "group"',
      partnerAction: 'group',
      mapping: defaultValues(group.fields),
      type: 'automatic'
    }
  ]
}

export default destination
