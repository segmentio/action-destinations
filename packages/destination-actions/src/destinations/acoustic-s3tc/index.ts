import type { DestinationDefinition } from '@segment/actions-core'

import type { Settings } from './generated-types'

import acousticS3TC from './acousticS3TC'

const destination: DestinationDefinition<Settings> = {
  name: 'Acoustic S3TC',
  slug: 'actions-acoustic-s3tc',
  mode: 'cloud',

  authentication: {
    scheme: 'basic',
    fields: {
      username: {
        label: 'Username',
        description: 'Your Acoustic S3TC username',
        type: 'string',
        required: true
      },
      password: {
        label: 'password',
        description: 'Your Acoustic S3TC password.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request) => {
      request.length
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
    }
  },

  extendRequest({ settings }) {
    return {
      username: settings.username,
      password: settings.password
    }
  },

  onDelete: async (request, { settings, payload }) => {
    request.length
    settings.password
    payload.userId
    // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
    // provided in the payload. If your destination does not support GDPR deletion you should not
    // implement this function and should remove it completely.
  },

  actions: {
    acousticS3TC
  }
}

export default destination
