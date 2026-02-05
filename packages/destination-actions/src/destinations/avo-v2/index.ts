/* eslint-disable @typescript-eslint/no-explicit-any */

import { DestinationDefinition, defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'
import sendSchemaToInspector from './sendSchemaToInspector'
import { Environment } from './constants'

const destination: DestinationDefinition<Settings> = {
  name: 'Avo Inspector v2',
  slug: 'actions-avo-v2',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'Avo Inspector API Key',
        description: 'Avo Inspector API Key can be found in the Inspector setup page on your source in Avo.',
        type: 'password',
        required: true
      },
      publicEncryptionKey: {
        label: 'Avo Inspector Public Encryption Key',
        description:
          'Optional. Enables verification of the property values against your Tracking Plan (e.g. allowed values, regex patterns, min/max constraints). Values are end-to-end encrypted and Avo can not decrypt them. Read more: https://www.avo.app/docs/inspector/connect-inspector-to-segment#property-value-validation-optional',
        type: 'password',
        required: false
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
      const { apiKey } = settings

      const resp = request(`https://api.avo.app/auth/inspector/validate`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey
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
      mapping: defaultValues(sendSchemaToInspector.fields),
      type: 'automatic'
    }
  ],
  actions: {
    sendSchemaToInspector
  }
}

export default destination
