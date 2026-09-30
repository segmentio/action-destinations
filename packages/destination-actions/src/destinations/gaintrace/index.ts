import type { DestinationDefinition } from '@segment/actions-core'
import { defaultValues, InvalidAuthenticationError } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { API_BASE, REQUEST_TIMEOUT_MS } from './constants'

import trackEvent from './trackEvent'
import identifyUser from './identifyUser'
import groupCompany from './groupCompany'
import pageView from './pageView'

const destination: DestinationDefinition<Settings> = {
  name: 'GainTrace',
  slug: 'actions-gaintrace',
  mode: 'cloud',
  description:
    'Send product usage, people and company data to GainTrace, where it drives feature adoption, account health and churn risk signals for customer success teams.',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description:
          'A GainTrace API key. In GainTrace go to Settings, API keys, create a key and choose the "Segment destination" preset, which selects exactly the scopes this integration needs (read:companies, write:events, write:contacts, write:companies).',
        type: 'password',
        required: true
      }
    },
    testAuthentication: async (request) => {
      try {
        await request(`${API_BASE}/companies?limit=1`, { method: 'GET' })
      } catch (error) {
        throw new InvalidAuthenticationError(
          'Could not authenticate with GainTrace. Check the API key is correct and has not been revoked. The "Segment destination" preset on the GainTrace API keys screen grants exactly the scopes this integration needs.'
        )
      }
    }
  },

  extendRequest: ({ settings }) => ({
    headers: { Authorization: `Bearer ${settings.apiKey}` },
    timeout: REQUEST_TIMEOUT_MS
  }),

  onDelete: async (request, { payload }) =>
    request(`${API_BASE}/contacts?externalId=${encodeURIComponent(String(payload.userId))}`, {
      method: 'DELETE'
    }),

  presets: [
    {
      name: 'Track Calls',
      subscribe: 'type = "track"',
      partnerAction: 'trackEvent',
      mapping: defaultValues(trackEvent.fields),
      type: 'automatic'
    },
    {
      name: 'Identify Calls',
      subscribe: 'type = "identify" and context.groupId != null',
      partnerAction: 'identifyUser',
      mapping: defaultValues(identifyUser.fields),
      type: 'automatic'
    },
    {
      name: 'Group Calls',
      subscribe: 'type = "group"',
      partnerAction: 'groupCompany',
      mapping: defaultValues(groupCompany.fields),
      type: 'automatic'
    }
  ],

  actions: {
    trackEvent,
    identifyUser,
    groupCompany,
    pageView
  }
}

export default destination
