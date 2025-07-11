import { AudienceDestinationDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'

import triggerBehavioralAction from './triggerBehavioralAction'

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Eagle Eye',
  slug: 'actions-eagleeye',
  mode: 'cloud',
  description: 'Synchronize Segment audiences to trigger behavioral actions in Eagle Eye AIR, enabling customer rewards.',
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
      }
    }
  },
  audienceFields: {
    behavioralActionTriggerReferences: {
      label: 'Behavioral Action trigger reference',
      type: 'string',
      description: 'Required if connecting to an Engage Audience. Accepts a comma delimited list of reference strings for the Behavioral Action to be executed. E.g.: A0001,P0001',
      required: false
    }
  },
  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },
    async createAudience(_, createAudienceInput) {
      const triggerRef = createAudienceInput?.audienceSettings?.behavioralActionTriggerReferences?.trim()

      if(!triggerRef) {
        throw new IntegrationError(
          'Behavioral Action trigger references cannot be empty',
          'Invalid Audience Settings',
          400
        )
      }

      return { externalId: triggerRef }
    },
    async getAudience(_, getAudienceInput) {
      return {
        externalId: getAudienceInput.externalId
      }
    }
  },
  actions: {
    triggerBehavioralAction
  }
}

export default destination
