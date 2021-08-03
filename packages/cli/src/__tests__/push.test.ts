import { getOptions } from '../commands/push'
import { destinationMetadata, destinationSchema, expectedDestinationMetadataOptions } from './testData'

describe('cli push command', () => {
  test('should add oauth fields to options', () => {
    const expectedDestinationMetadataOptionsOAuth = Object.assign({}, expectedDestinationMetadataOptions)
    // @ts-ignore
    expectedDestinationMetadataOptionsOAuth['oauth'] = {
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

    const optionsResult = getOptions(destinationMetadata, destinationSchema)
    expect(optionsResult).toEqual(expectedDestinationMetadataOptionsOAuth)
  })

  test('should not add oauth fields to options', () => {
    const customDestinationSchema = destinationSchema
    // @ts-ignore
    customDestinationSchema.authentication.scheme = 'custom'
    const optionsResult = getOptions(destinationMetadata, customDestinationSchema)
    expect(optionsResult).toEqual(expectedDestinationMetadataOptions)
  })
})
