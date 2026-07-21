import { defaultValues } from '@segment/actions-core'
import { Preset } from '@segment/actions-core/destination-kit'
import sync from './sync'

export const presets: Preset[] = [
  {
    name: 'Entities Audience Membership Changed',
    partnerAction: 'sync',
    mapping: defaultValues(sync.fields),
    type: 'specificEvent',
    eventSlug: 'warehouse_audience_membership_changed_identify'
  },
  {
    name: 'Associated Entity Added',
    partnerAction: 'sync',
    mapping: defaultValues(sync.fields),
    type: 'specificEvent',
    eventSlug: 'warehouse_entity_added_track'
  },
  {
    name: 'Associated Entity Removed',
    partnerAction: 'sync',
    mapping: defaultValues(sync.fields),
    type: 'specificEvent',
    eventSlug: 'warehouse_entity_removed_track'
  },
  {
    name: 'Journeys Step Entered',
    partnerAction: 'sync',
    mapping: defaultValues(sync.fields),
    type: 'specificEvent',
    eventSlug: 'journeys_step_entered_track'
  }
]
