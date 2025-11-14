import type { InputField } from '@segment/actions-core'
import { DESTINATION_INTEGRATION_NAME } from './autocapture-attribution'

export const autocaptureFields: Record<string, InputField> = {
    add: {
      label: 'Add',
      description:
        "Increment a user property by a number with add. If the user property doesn't have a value set yet, it's initialized to 0.",
      type: 'object',
      additionalProperties: true,
      defaultObjectUI: 'keyvalue'
    },
    autocaptureAttributionEnabled: {
      label: 'Autocapture Attribution Enabled',
      description: 'Utility field used to detect if Autocapture Attribution Plugin is enabled.',
      type: 'boolean',
      default: { '@path': `$.context.integrations.${DESTINATION_INTEGRATION_NAME}.autocapture_attribution.enabled` },
      readOnly: true
    },
    autocaptureAttributionSet: {
        label: 'Autocapture Attribution Set',
        description: 'Utility field used to detect if any attribution values need to be set.',
        type: 'object',
        default: { '@path': `$.context.integrations.${DESTINATION_INTEGRATION_NAME}.autocapture_attribution.set` },
        readOnly: true
      },
    autocaptureAttributionSetOnce: {
      label: 'Autocapture Attribution Set Once',
      description: 'Utility field used to detect if any attribution values need to be set_once.',
      type: 'object',
      default: { '@path': `$.context.integrations.${DESTINATION_INTEGRATION_NAME}.autocapture_attribution.set_once` },
      readOnly: true
    },
    autocaptureAttributionUnset: {
      label: 'Autocapture Attribution Unset',
      description: 'Utility field used to detect if any attribution values need to be unset.',
      type: 'string',
      multiple: true,
      default: { '@path': `$.context.integrations.${DESTINATION_INTEGRATION_NAME}.autocapture_attribution.unset` },
      readOnly: true
    }
}