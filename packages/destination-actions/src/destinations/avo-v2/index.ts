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
        type: 'string',
        required: true
      },
      publicEncryptionKey: {
        label: 'Avo Inspector Public Encryption Key',
        description:
          'Optional. Enables verification of the property values against your Tracking Plan (e.g. allowed values, min/max constraints). Values are end-to-end encrypted and Avo can not decrypt them. Read more: https://www.avo.app/docs/inspector/connect-inspector-to-segment#property-value-validation-optional',
        type: 'string',
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
      },
      gatewaySupport: {
        label: 'Gateway Support',
        description:
          "Sends events to Avo Inspector's current endpoint, which supports Avo gateways and the Output Reference and Origin Hint fields. On by default for new destinations. Destinations added before this option existed keep using the previous endpoint until you turn it on.",
        type: 'boolean',
        required: false,
        default: true
      },
      inspectedFields: {
        label: 'Gateway Inspection Scope',
        description:
          'For gateways only. Requires Gateway Support. What Avo Inspector inspects for each event, named the way a warehouse stores it. "Event properties" inspects the event properties only. "Event properties and context" also inspects every context field, as a column such as context_page_path. "Everything the warehouse stores" also inspects anonymous_id, user_id, id, event, timestamp, original_timestamp, sent_at and received_at. Avo receives the names and types of these fields, never their values.',
        type: 'string',
        choices: [
          { label: 'Event properties', value: 'event' },
          { label: 'Event properties and context', value: 'event+context' },
          { label: 'Everything the warehouse stores', value: 'everything' }
        ],
        required: false,
        default: 'everything'
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
