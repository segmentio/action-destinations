import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import receiveEvents from './receiveEvents'
import { getAccessToken } from './Utility/tablemaintutilities'

//May 30th, refactor for additional Customers
export interface refreshTokenResult {
  access_token: string
  token_type: string
  refresh_token: string
  expires_in: number
}

/** Used in the quick setup dialog for Mapping */
const presets: DestinationDefinition['presets'] = [
  {
    name: 'Track Calls',
    subscribe: 'type = "track"',
    partnerAction: 'receiveEvents',
    mapping: {
      ...defaultValues(receiveEvents.fields),
      email: {
        '@if': {
          exists: { '@path': '$.properties.email' },
          then: { '@path': '$.properties.email' },
          else: { '@path': '$.context.traits.email' }
        }
      }
    }
  },
  {
    name: 'Identify Calls',
    subscribe: 'type = "identify"',
    partnerAction: 'receiveEvents',
    mapping: {
      ...defaultValues(receiveEvents.fields),
      email: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.context.traits.email' }
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
    scheme: 'oauth2',
    fields: {
      pod: {
        label: 'Pod',
        description: 'Pod Number of Campaign Instance',
        default: '2',
        type: 'string',
        required: true
      },
      region: {
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
      events_table_list_id: {
        label: 'Acoustic Segment Events Table List Id',
        description: 'The Segment Events Table List Id from the Database-Relational Table dialog in Acoustic Campaign',
        default: '',
        type: 'string',
        required: false
      },
      events_table_list_name: {
        label: 'Acoustic Segment Events Table Name',
        description: 'The Segment Events Table Name in Acoustic Campaign',
        default: 'Segment Events Table',
        type: 'string',
        required: false
      },
      a_clientId: {
        label: 'Acoustic app definition ClientId',
        description: 'The Client Id from the App definition dialog in Acoustic Campaign',
        default: '',
        type: 'string',
        required: true
      },
      a_clientSecret: {
        label: 'Acoustic App definition ClientSecret',
        description: 'The Client Secret from the App definition dialog in Acoustic Campaign',
        default: '',
        type: 'password',
        required: true
      },
      a_refreshToken: {
        label: 'Acoustic App Access Definition RefreshToken',
        description: 'The RefreshToken provided when defining access for the App in Acoustic Campaign',
        default: '',
        type: 'password',
        required: true
      },
      attributesMax: {
        label: 'Properties Max',
        description: 'Note: Before increasing the default max number, consult the Acoustic Destination documentation.',
        default: 30,
        type: 'number',
        required: false
      }
    },
    refreshAccessToken: async (request, { settings }) => {
      return await getAccessToken(request, settings)
      //   const at = await request<refreshAccessTokenResult>(
      //     `https://api-campaign-${settings.region}-${settings.pod}.goacoustic.com/oauth/token`,
      //     {
      //       method: 'POST',
      //       body: new URLSearchParams({
      //         refresh_token: settings.a_refreshToken,
      //         client_id: settings.a_clientId,
      //         client_secret: settings.a_clientSecret,
      //         grant_type: 'refresh_token'
      //       }),
      //       headers: {
      //         'Content-Type': 'application/x-www-form-urlencoded',
      //         'user-agent': `Segment Action (Acoustic Destination)`,
      //         Connection: 'keep-alive',
      //         'Accept-Encoding': 'gzip, deflate, br',
      //         Accept: '*/*'
      //       }
      //     }
      //   )
      //   return { accessToken: at.data.access_token }
    }
  },
  presets,
  actions: {
    receiveEvents
  }
}
export default destination
