import { defaultValues, AudienceDestinationDefinition } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import updateSegment from './updateSegment'

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Delivr AI Audiences',
  slug: 'actions-delivrai-audiences',
  mode: 'cloud',
  description: 'Sync users to Delivr AI Audience Segmentation.',
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
  },
  presets: [
    {
      name: 'Entities Audience Membership Changed',
      partnerAction: 'updateSegment',
      mapping: {
        ...defaultValues(updateSegment.fields)
      },
      type: 'specificEvent',
      eventSlug: 'warehouse_audience_membership_changed_identify'
    },
    {
      name: 'Journeys Step Entered',
      partnerAction: 'updateSegment',
      mapping: {
        ...defaultValues(updateSegment.fields)
      },
      type: 'specificEvent',
      eventSlug: 'journeys_step_entered_track'
    }
  ]
}
export default destination
