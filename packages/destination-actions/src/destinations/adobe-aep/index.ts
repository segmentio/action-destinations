import type { DestinationDefinition } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { getAccessToken } from './utils'
import sendEvent from './sendEvent'
import upsertProfile from './upsertProfile'

const destination: DestinationDefinition<Settings> = {
  name: 'Adobe Experience Platform (Streaming)',
  slug: 'actions-adobe-aep',
  mode: 'cloud',
  description:
    'Stream Segment events and profiles to Adobe Experience Platform as XDM records, for reporting in Customer Journey Analytics.',

  authentication: {
    scheme: 'oauth2',
    fields: {
      client_id: {
        label: 'Client ID',
        description:
          'The Client ID (API key) of an OAuth Server-to-Server credential in Adobe Developer Console. The project must include the Experience Platform API.',
        type: 'string',
        required: true
      },
      client_secret: {
        label: 'Client Secret',
        description: 'The Client Secret of the same OAuth Server-to-Server credential.',
        type: 'password',
        required: true
      }
    },
    // Only checks that the credentials can get a token. Organization, sandbox, inlet, schema, dataset and
    // dataflow are per-mapping fields and can't be checked here.
    testAuthentication: async (request, { settings }) => {
      await getAccessToken(request, settings.client_id, settings.client_secret)
    },
    refreshAccessToken: async (request, { settings }) => {
      const accessToken = await getAccessToken(request, settings.client_id, settings.client_secret)
      return { accessToken }
    }
  },

  extendRequest({ settings, auth }) {
    const headers: Record<string, string> = {}
    if (auth?.accessToken) {
      headers['Authorization'] = `Bearer ${auth.accessToken}`
    }
    // TODO(Q10): confirm streaming ingestion needs x-api-key; it isn't in the streaming ingestion spec.
    if (settings?.client_id) {
      headers['x-api-key'] = settings.client_id
    }
    return { headers }
  },

  presets: [
    {
      name: 'Send Event',
      subscribe: sendEvent.defaultSubscription as string,
      partnerAction: 'sendEvent',
      mapping: defaultValues(sendEvent.fields),
      type: 'automatic'
    },
    {
      name: 'Upsert Profile',
      subscribe: upsertProfile.defaultSubscription as string,
      partnerAction: 'upsertProfile',
      mapping: defaultValues(upsertProfile.fields),
      type: 'automatic'
    }
  ],

  actions: {
    sendEvent,
    upsertProfile
  }
}

export default destination
