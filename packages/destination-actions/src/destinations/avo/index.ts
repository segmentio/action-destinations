/* eslint-disable @typescript-eslint/no-explicit-any */

import { DestinationDefinition, defaultValues } from '@segment/actions-core'
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
        label: 'Avo Inspector API Key',
        description: 'Avo Inspector API Key can be found in the Inspector setup page on your source in Avo.',
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
        label: 'App Version Property',
        description:
          'If you send a custom event property on all events that contains the app version, please enter the name of that property here (e.g. “app_version”). If you do not have a custom event property for the app version, please leave this field empty.',
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
  presets: [
    {
      name: 'Track Schema From Event',
      subscribe: 'type = "track"',
      partnerAction: 'sendSchemaToInspector',
      mapping: defaultValues(sendSchemaAction.fields),
      type: 'automatic'
    }
  ],
  actions: {
    sendSchemaToInspector: sendSchemaAction // Add your action here
  }
}

export default destination
