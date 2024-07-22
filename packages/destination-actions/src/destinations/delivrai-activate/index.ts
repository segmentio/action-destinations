import type { AudienceDestinationDefinition } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import updateSegment from './updateSegment'

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Delivr AI Audiences',
  slug: 'actions-delivrai-audiences',
  mode: 'cloud',
  description: 'Sync Segment Engage Audiences to Delivr AI Audience Segmentation.',
  authentication: {
    scheme: 'custom',
    fields: {
      client_identifier_id: {
        label: 'Client Identifier',
        description: 'Client Identifier is the Hashed Key that provided by Delivr AI.',
        type: 'string',
        required: true
      }
    }
  },
  audienceFields: {
    placeholder: {
      type: 'boolean',
      label: 'Placeholder Setting',
      description: 'Placeholder field to allow the audience to be created. Do not change this.',
      default: true
    }
    // This is a required object, but we don't need to define any fields
    // Placeholder setting will be removed once we make AudienceSettings optional
  },
  audienceConfig: {
    mode: {
      type: 'synced', // Indicates that the audience is synced on some schedule
      full_audience_sync: false // If true, we send the entire audience. If false, we just send the delta.
    }
  },

  actions: {
    updateSegment
  }
}
export default destination
