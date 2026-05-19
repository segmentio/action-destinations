import type { AudienceDestinationDefinition } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import syncAudience from './syncAudience'

const presets: AudienceDestinationDefinition<Settings, AudienceSettings>['presets'] = [
  {
    name: 'Entities Audience Membership Changed',
    partnerAction: 'syncAudience',
    mapping: defaultValues(syncAudience.fields),
    type: 'specificEvent',
    eventSlug: 'warehouse_audience_membership_changed_identify'
  },
  {
    name: 'Associated Entity Added',
    partnerAction: 'syncAudience',
    mapping: defaultValues(syncAudience.fields),
    type: 'specificEvent',
    eventSlug: 'warehouse_entity_added_track'
  },
  {
    name: 'Associated Entity Removed',
    partnerAction: 'syncAudience',
    mapping: defaultValues(syncAudience.fields),
    type: 'specificEvent',
    eventSlug: 'warehouse_entity_removed_track'
  },
  {
    name: 'Journeys Step Entered',
    partnerAction: 'syncAudience',
    mapping: defaultValues(syncAudience.fields),
    type: 'specificEvent',
    eventSlug: 'journeys_step_entered_track'
  }
]

export { presets }
