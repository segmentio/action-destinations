import { defaultValues, type DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import triggerBehavioralAction from './triggerBehavioralAction'

const presets: DestinationDefinition['presets'] = [
  {
    name: 'Trigger Points Reward',
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
  description: 'Trigger Behavioral Actions in Eagle Eye AIR based on Segment events to provide rewards for your customers',

  authentication: {
    scheme: 'custom',
    fields: {
      connectorUrl: {
        label: 'Connector URL',
        description: 'Eagle Eye URL of the Segment connector provided by your EagleEye CSM',
        type: 'string',
        format: 'uri',
        required: true
      },
      externalKey: {
        label: 'Connector External Key',
        description: 'Key to authenticate with the connector provided by your EagleEye CSM',
        type: 'password',
        required: true
      },
    }
  },

  presets,

  actions: {
    triggerBehavioralAction
  }
}

export default destination
