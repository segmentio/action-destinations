import { defaultValues, DestinationDefinition } from '@segment/actions-core'
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
      ...defaultValues(receiveEvents.fields),
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
    partnerAction: 'trackEvent',
    mapping: {
      ...defaultValues(receiveEvents.fields),
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
  name: 'Acoustic Campaign (Actions)',
  slug: 'actions-acoustic-campaign',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
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
      },
      a_clientId: {
        label: 'Acoustic App Client Id',
        description: 'The Client Id from the App definition dialog in Acoustic Campaign',
        default: '',
        type: 'string',
        required: true
      },
      a_clientSecret: {
        label: 'Acoustic App Client Secret',
        description: 'The Client Secret from the App definition dialog in Acoustic Campaign',
        default: '',
        type: 'password',
        required: true
      },
      a_refreshToken: {
        label: 'Acoustic App Refresh Token',
        description: 'The Refresh Token from the App Account dialog in Acoustic Campaign',
        default: '',
        type: 'password',
        required: true
      }
    },
    testAuthentication: (_request) => {
      return true
      // return request(`https://api-campaign-${settings.a_region}-${settings.a_pod}.goacoustic.com/oauth/token`, {
      //   method: 'POST',
      // body: new URLSearchParams({
      //   refresh_token: settings.a_refreshToken,
      //   client_id: settings.a_clientId,
      //   client_secret: a_clientSecret,
      //   grant_type: 'refresh_token'
      // }),
      // headers: {
      //   'user-agent': `Segment (refreshtoken)`,
      //   'Content-Type': 'application/x-www-form-urlencoded'
      // }
      // })
    }
  },
  extendRequest: ({ settings, auth }) => {
    return {
      headers: {
        // Authorization: `Bearer ${auth?.accessToken}`,
        'Content-Type': 'text/xml',
        'user-agent': `Segment (checkforRT on Pod ${settings.a_pod}_${auth?.accessToken})`,
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
