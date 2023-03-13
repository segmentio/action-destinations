import { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import receiveEvents from './receiveEvents'

export interface refreshTokenResult {
  access_token: string
  token_type: string
  refresh_token: string
  expires_in: number
}

/** used in the quick setup dialog for Mapping */
const presets: DestinationDefinition['presets'] = [
  {
    name: 'Track Calls',
    subscribe: 'type = "track"',
    partnerAction: 'trackEvent',
    mapping: {
      email: {
        default: {
          '@if': {
            exists: { '@path': '$.properties.email' },
            then: { '@path': '$.properties.email' },
            else: { '@path': '$.context.traits.email' }
          }
        }
      }
    }
  },
  {
    name: 'Identify Calls',
    subscribe: 'type = "identify"',
    partnerAction: 'identifyUser',
    mapping: {
      email: {
        default: {
          '@if': {
            exists: { '@path': '$.traits.email' },
            then: { '@path': '$.traits.email' },
            else: { '@path': '$.context.traits.email' }
          }
        }
      }
    }
  }
]

const destination: DestinationDefinition<Settings> = {
  name: 'Acoustic Campaign',
  slug: 'actions-acoustic-campaign',
  mode: 'cloud',
  authentication: {
    scheme: 'oauth-managed',
    fields: {
      a_pod: {
        label: 'Pod',
        description: 'Pod Number of Campaign Instance',
        default: '2',
        type: 'string',
        required: true
      },
      a_region: {
        label: 'Region',
        description: 'Region where Pod is hosted, either US, EU, AP, or CA',
        choices: [
          { label: 'US', value: 'US' },
          { label: 'EU', value: 'EU' },
          { label: 'AP', value: 'AP' },
          { label: 'CA', value: 'CA' }
        ],
        default: 'US',
        type: 'string',
        required: true
      },
      a_attributesMax: {
        label: 'Properties Max',
        description: 'Note: Before increasing the default max number, consult the Acoustic Destination documentation.',
        default: 30,
        type: 'number',
        required: false
      },
      a_events_table_list_id: {
        label: 'Acoustic Segment Events Table List Id',
        description: 'The Segment Events Table List Id from the Database dialog in Acoustic Campaign',
        default: '',
        type: 'string',
        required: false
      }
    },

    refreshAccessToken: async (request, { settings, auth }) => {
      // Return a request that refreshes the access_token if the API supports it

      const at = await request<refreshTokenResult>(
        `https://api-campaign-${settings.a_region}-${settings.a_pod}.goacoustic.com/oauth/token`,
        {
          method: 'POST',
          body: new URLSearchParams({
            refresh_token: auth.refreshToken,
            client_id: auth.clientId,
            client_secret: auth.clientSecret,
            grant_type: 'refresh_token'
          }),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      )
      return { accessToken: at.data.access_token }
    }
  },
  extendRequest({ settings, auth }) {
    settings
    return {
      headers: {
        Authorization: `Bearer ${auth?.accessToken}`,
        'Content-Type': 'text/xml',
        'user-agent': 'Segment (checkforRT)',
        Connection: 'keep-alive',
        'Accept-Encoding': 'gzip, deflate, br',
        Accept: '*/*'
      }
    }
  },
  presets,
  actions: {
    receiveEvents
  }
}
export default destination
