import { defaultValues, type DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import triggerBehavioralAction from './triggerBehavioralAction'

const presets: DestinationDefinition['presets'] = [
  {
    name: 'Trigger points reward after joining the loyalty program',
    subscribe: 'type = "track" and event = "Loyalty Program Joined"',
    partnerAction: 'triggerBehavioralAction',
    mapping: {
      ...defaultValues(triggerBehavioralAction.fields),
    },
    type: 'automatic'
  },
]

const destination: DestinationDefinition<Settings> = {
  name: 'Eagle Eye (Actions)',
  slug: 'eagleeye-actions',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      connectorUrl: {
        label: 'Connector URL',
        description: 'URL of the Segment connector provided by EagleEye',
        type: 'string',
        format: 'uri',
        required: true
      },
      externalKey: {
        label: 'Connector External Key',
        description: 'Key to authenticate with the connector provided by EagleEye',
        type: 'password',
        required: true
      },
      behavioralActionTriggerReference: {
        label: 'Behavioral Action trigger reference',
        description: 'Reference string for the Behavioral Action to be executed. E.g.: A0001',
        type: 'string',
        required: true
      }
    }
  },

  presets,

  actions: {
    triggerBehavioralAction
  }
}

export default destination
