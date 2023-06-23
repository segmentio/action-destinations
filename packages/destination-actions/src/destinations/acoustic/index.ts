import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import receiveEvents from './receiveEvents'
import { getAccessToken } from './Utility/tablemaintutilities'

const mod = `
Last-Modified: 06.23.2023 12.42.42
`
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
        description: 'Pod Number for API Endpoint',
        default: '2',
        type: 'string',
        required: true
      },
      region: {
        label: 'Region',
        description: 'Region for API Endpoint, either US, EU, AP, or CA',
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
      tableName: {
        label: 'Acoustic Segment Table Name',
        description: `The Segment Table Name in Acoustic Campaign Data dialog.`,
        default: 'Segment Events Table Name',
        type: 'string',
        required: true
      },
      tableListId: {
        label: 'Acoustic Segment Table List Id',
        description: 'The Segment Table List Id from the Database-Relational Table dialog in Acoustic Campaign',
        default: '',
        type: 'string',
        required: true
      },
      a_clientId: {
        label: 'Acoustic App Definition ClientId',
        description: 'The Client Id from the App definition dialog in Acoustic Campaign',
        default: '',
        type: 'string',
        required: true
      },
      a_clientSecret: {
        label: 'Acoustic App Definition ClientSecret',
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
        description:
          'A safety against mapping too many attributes into the Event, ignore Event if number of Event Attributes exceeds this maximum. Note: Before increasing the default max number, consult the Acoustic Destination documentation.',
        default: 15,
        type: 'number',
        required: false
      },
      version: {
        label: `Version:`,
        description: `${mod}`,
        default: 'Version 3.1',
        type: 'string',
        required: false
      }
    },
    refreshAccessToken: async (request, { settings }) => {
      return await getAccessToken(request, settings)
    }
  },
  presets,
  actions: {
    receiveEvents
  }
}
export default destination
