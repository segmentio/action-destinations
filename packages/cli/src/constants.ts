// @ts-ignore it's ok shhh
import { DestinationMetadataOption } from './lib/control-plane-service'

export const RESERVED_FIELD_NAMES = [
  'oauth',
  'oauth2',
  'accesstoken',
  'access-token',
  'acccess_token',
  'refresh-token',
  'refresh_token',
  'token_type'
]

export const OAUTH_SCHEME = 'oauth2'

export const OAUTH_OPTIONS: DestinationMetadataOption = {
  default: {},
  description: 'Authorizes Segment to OAuth to the Destination API',
  encrypt: false,
  hidden: true,
  label: 'OAuth',
  private: true,
  scope: 'event_destination',
  type: 'oauth',
  fields: [
    {
      'access-token': {
        description: 'The (legacy) access token provided by Destination API after the OAuth handshake.',
        type: 'string'
      },
      access_token: {
        description: 'The access token provided by Destination API after the OAuth handshake.',
        type: 'string'
      },
      appId: {
        description: 'The App ID, retrieved via Destination API post-auth.',
        type: 'string'
      },
      appName: {
        description:
          'The authorized user App, as represented in the integration UI, retrieved via Destination API on settings view load and cached in settings.',
        type: 'string'
      },
      createdAt: {
        description: 'Date of OAuth connection.',
        type: 'string'
      },
      createdBy: {
        description: 'Email address of segment user who connected OAuth.',
        type: 'string'
      },
      displayName: {
        description:
          'The authorized user, as represented in the integration UI, retrieved via Destination API on settings view load and cached in settings.',
        type: 'string'
      },
      refresh_token: {
        description: 'The refresh token provided by Destination API after the OAuth handshake.',
        type: 'string'
      },
      token_type: {
        description: '',
        type: 'string'
      }
    }
  ]
}

export const OAUTH_GENERATE_TYPES = {
  accessToken: {
    label: 'Access Token',
    type: 'string',
    required: true,
    description: 'Token issued by the partner API after verifying the identity of the user account'
  },
  refreshToken: {
    label: 'Refresh Token',
    type: 'string',
    description:
      'Token provided by the partner API that can be used to request a fresh access token from the authorization server'
  }
}
