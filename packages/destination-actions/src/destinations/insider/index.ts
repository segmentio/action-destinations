import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { API_BASE, UPSERT_ENDPOINT } from './insider-helpers'

const destination: DestinationDefinition<Settings> = {
  name: 'Insider',
  slug: 'actions-insider',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      account_name: {
        label: 'Insider Account Name',
        description:
          'Insider Account Name is your account name which you can find under Account Preferences at InOne Settings.',
        type: 'string',
        required: true
      },
      ucd_key: {
        label: 'UCD Upsert Key',
        description:
          'UCD Upsert Key is your unique Upsert Key which you can find under Account Preferences at InOne Settings.',
        type: 'password',
        required: true
      }
    },
    testAuthentication: async (request) => {
      const data = await request(`${API_BASE}${UPSERT_ENDPOINT}`)
      if (data.status === 200) {
        return true
      }

      throw new Error('Authentication failed')
    }
  },
  extendRequest: ({ settings }) => {
    return {
      headers: { 'X-PARTNER-NAME': settings.account_name, 'X-REQUEST-TOKEN': settings.ucd_key }
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onDelete: async (request, { settings, payload }) => {
    // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
    // provided in the payload. If your destination does not support GDPR deletion you should not
    // implement this function and should remove it completely.

    const { userId, anonymousId } = payload
    return request('https://example.com/delete', {
      method: 'POST',
      json: {
        userId,
        anonymousId,
        settings
      }
    })
  },

  actions: {}
}

export default destination
