import type { DestinationDefinition } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'
import track from './track'
import group from './group'
import identify from './identify'
import { IntegrationBaseUrl, IntegrationName, IntegrationWebsite } from './contants'

const destination: DestinationDefinition<Settings> = {
  name: IntegrationName,
  slug: 'inleads-ai',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: `Your ${IntegrationName} API Key. You can find your API Key in your ${IntegrationWebsite} settings.`,
        type: 'string',
        format: 'password',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      const AUTH_KEY = settings.apiKey
      return await request(`${IntegrationBaseUrl}/events/validate/key`, {
        method: 'post',
        headers: {
          Authorization: `Basic ${AUTH_KEY}`
        },
        json: { apiKey: AUTH_KEY }
      })
    }
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
      name: 'Group',
      subscribe: 'type = "group"',
      partnerAction: 'group',
      mapping: defaultValues(group.fields),
      type: 'automatic'
    },
    {
      name: 'Identify User',
      subscribe: 'type = "identify"',
      partnerAction: 'identify',
      mapping: defaultValues(identify.fields),
      type: 'automatic'
    }
  ],
  actions: {
    identify,
    group,
    track
  }
}

export default destination
