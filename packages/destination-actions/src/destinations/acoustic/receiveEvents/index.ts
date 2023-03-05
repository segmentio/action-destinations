import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { Payload } from './generated-types'
import { IntegrationError } from '@segment/actions-core'
import { preChecksAndMaint } from '../Utility/TableMaint_Utilities'
import get from 'lodash/get'
import { addUpdateEvents } from '../Utility/EventProcessing'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Receive Track and Identify Events',
  description: 'Provide Segment Track and Identify Event Data to Acoustic Campaign',
  fields: {
    email: {
      label: 'Email',
      description: 'Email Field',
      type: 'string',
      format: 'email',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.properties.email' },
          then: { '@path': '$.properties.email' },
          else: { '@path': '$.traits.email' }
        }
      }
    },
    type: {
      label: 'Type',
      description: 'Event Type',
      type: 'string',
      default: {
        '@path': '$.type'
      }
    },
    timestamp: {
      label: 'Timestamp',
      description: 'Timestamp',
      type: 'datetime',
      default: {
        '@path': '$.timestamp'
      }
    },
    context: {
      label: 'Context',
      description: 'Context Section',
      type: 'object',
      default: {
        '@path': '$.context'
      }
    },
    properties: {
      label: 'Properties',
      description: 'Properties Section',
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    },
    traits: {
      label: 'Traits',
      description: 'Traits Section',
      type: 'object',
      default: {
        '@path': '$.traits'
      }
    },

    enable_batching: {
      label: 'Enable Batching',
      description: 'Enable batching of Segment Events through to Acoustic Tables',
      type: 'boolean',
      default: true
    }
  },

  perform: async (request, { settings, payload }) => {
    let email = get(payload, 'context.traits.email', 'Null')
    if (email == undefined || email === 'Null') email = get(payload, 'traits.email', 'Null')
    if (email == undefined || email === 'Null')
      throw new IntegrationError('Email not provided, cannot process Events without included Email')

    // export interface OAuth2ClientCredentials extends AuthTokens {
    //   /** Publicly exposed string that is used by the partner API to identify the application, also used to build authorization URLs that are presented to users */
    //   clientId: string
    //   /** Used to authenticate the identity of the application to the partner API when the application requests to access a user’s account, must be kept private between the application and the API. */
    //   clientSecret: string
    // }

    // export interface AuthTokens {
    //   /** OAuth2 access token */
    //   accessToken: string
    //   /** OAuth2 refresh token */
    //   refreshToken: string
    //   /** The refresh token url used to get an updated access token. This value is configured in the developer portal. **/
    //   refreshTokenUrl?: string
    // }

    // interface RefreshAuthSettings<Settings> {
    //   settings: Settings
    //   auth: OAuth2ClientCredentials
    // }
    // // interface AuthSettings<Settings> {
    //   settings: Settings
    //   auth: AuthTokens
    // }

    // interface OAuthSettings {
    //   access_token: string
    //   refresh_token: string
    //   clientId: string
    //   clientSecret: string
    //   refresh_token_url: string
    // }

    // export interface AuthTokens {
    //   /** OAuth2 access token */
    //   accessToken: string
    //   /** OAuth2 refresh token */
    //   refreshToken: string
    //   /** The refresh token url used to get an updated access token. This value is configured in the developer portal. **/
    //   refreshTokenUrl?: string
    // }
    //
    // interface AuthSettings<Settings> {
    //   settings: Settings
    //   auth: AuthTokens
    // }

    // refreshAccessToken?: (
    //   request: RequestClient,
    //   input: RefreshAuthSettings<Settings>
    // ) => Promise<RefreshAccessTokenResult>
    // }

    // interface RefreshAuthSettings<Settings> {
    //   settings: Settings
    //   auth: OAuth2ClientCredentials
    // }

    //   {
    //   clientId: settings.a_client_id,
    //   clientSeret: settings.a_client_secret,
    //   refreshToken: settings.a_refresh_token
    // })

    const at = await preChecksAndMaint(request, settings)

    //Ok, prechecks and Maint are all accomplished, let's see what needs to be processed,
    return await addUpdateEvents(request, payload, settings, at, email)
  },

  performBatch: async (request, { settings, payload }) => {
    const at = await preChecksAndMaint(request, settings)

    //Ok, prechecks and Maint are all attended to, let's see what needs to be processed,
    let i = 0
    for (const e of payload) {
      i++

      let email = get(e, 'context.traits.email', 'Null')
      if (email == undefined) email = get(e, 'traits.email', 'Null')
      if (email == undefined)
        throw new IntegrationError('Email not provided, cannot process Events without included Email')

      return await addUpdateEvents(request, e, settings, at, email)
    }
    return i
  }
}

export default action
