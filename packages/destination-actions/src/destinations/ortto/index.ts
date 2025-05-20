import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import upsertContactProfile from './upsertContactProfile'
import OrttoClient from './ortto-client'

import trackActivity from './trackActivity'

const destination: DestinationDefinition<Settings> = {
  name: 'Ortto (Actions)',
  slug: 'actions-ortto',
  mode: 'cloud',
  description:
    'Send customer data from Segment to Ortto in real time to power campaigns, trigger journeys, and manage audiences with greater flexibility and control.',
  authentication: {
    scheme: 'custom',
    fields: {
      api_key: {
        label: 'API Key',
        description: 'Ortto API key',
        type: 'password',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      const client: OrttoClient = new OrttoClient(request)
      return await client.testAuth(settings)
    }
  },
  extendRequest({ settings }) {
    if (process?.env?.ORTTO_API_KEY) {
      settings.api_key = process?.env?.ORTTO_API_KEY
    }
    return {
      headers: {
        Authorization: `Bearer ${settings.api_key}`
      }
    }
  },
  presets: [
    {
      name: upsertContactProfile.title,
      subscribe: 'type = "identify"',
      partnerAction: 'upsertContactProfile',
      mapping: defaultValues(upsertContactProfile.fields),
      type: 'automatic'
    }
  ],
  actions: {
    upsertContactProfile,
    trackActivity
  }
}

export default destination
