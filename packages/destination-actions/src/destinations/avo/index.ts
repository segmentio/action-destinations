/* eslint-disable @typescript-eslint/no-explicit-any */

import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import sendSchemaAction from './sendSchemaToInspector'
import { Environment } from './sendSchemaToInspector/avo-types'

const destination: DestinationDefinition<Settings> = {
  name: 'Avo',
  slug: 'actions-avo',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Avo Inspector API Key',
        type: 'string',
        required: true
      },
      env: {
        label: 'Environment',
        description: 'Avo Inspector Environment',
        type: 'string',
        choices: Object.values(Environment).map((environment) => ({ label: environment, value: environment })),
        default: Environment.PROD,
        required: true
      },
      appVersionPropertyName: {
        label: 'App Version property',
        description:
          'Optionally set which property represents the app version in your events. If not set, the app version will be taken from the $.context.app.version',
        type: 'string',
        required: false
      }
    },
    testAuthentication: (request, { settings }) => {
      // Return a request that tests/validates the user's credentials.
      const resp = request(`https://api.avo.app/auth/inspector/validate`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json' // This line is crucial for sending JSON content
        },
        body: JSON.stringify({
          apiKey: settings.apiKey
        })
      })

      return resp
    }
  },

  actions: {
    sendSchemaToInspector: sendSchemaAction // Add your action here
  }
}

export default destination
