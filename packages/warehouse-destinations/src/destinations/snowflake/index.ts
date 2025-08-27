import type { WarehouseDestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { defaultValues } from '@segment/actions-core'
import audienceDefaultFields from './sendCustomEvent/audience-default-fields'

import sendCustomEvent from './sendCustomEvent'
import journeysDefaultFields from './sendCustomEvent/journeys-default-fields'

const destination: WarehouseDestinationDefinition<Settings> = {
  name: 'Snowflake',
  slug: 'snowflake',
  mode: 'warehouse',

  settings: {
    warehouseId: {
      label: 'Warehouse ID',
      description: 'The ID of the existing Snowflake warehouse instance to use.',
      type: 'string',
      required: true
    }
  },

  presets: [
    {
      name: 'Linked Audience Entity Added',
      partnerAction: 'sendCustomEvent',
      mapping: {
        ...defaultValues(sendCustomEvent.fields),
        ...defaultValues(audienceDefaultFields)
      },
      type: 'specificEvent',
      eventSlug: 'warehouse_entity_added_track'
    },
    {
      name: 'Linked Audience Associated Entity Removed',
      partnerAction: 'sendCustomEvent',
      mapping: {
        ...defaultValues(sendCustomEvent.fields),
        ...defaultValues(audienceDefaultFields)
      },
      type: 'specificEvent',
      eventSlug: 'warehouse_entity_removed_track'
    },
    {
      name: 'Linked Audience Profile Entered',
      partnerAction: 'sendCustomEvent',
      mapping: {
        ...defaultValues(sendCustomEvent.fields),
        ...defaultValues(audienceDefaultFields)
      },
      type: 'specificEvent',
      eventSlug: 'warehouse_audience_entered_track'
    },
    {
      name: 'Linked Audience Profile Exited',
      partnerAction: 'sendCustomEvent',
      mapping: {
        ...defaultValues(sendCustomEvent.fields),
        ...defaultValues(audienceDefaultFields)
      },
      type: 'specificEvent',
      eventSlug: 'warehouse_audience_exited_track'
    },
    {
      name: 'Journeys Step Entered',
      partnerAction: 'sendCustomEvent',
      mapping: {
        ...defaultValues(sendCustomEvent.fields),
        // note that this must be `properties` to be processed by the warehouse pipeline
        ...defaultValues(journeysDefaultFields)
      },
      type: 'specificEvent',
      eventSlug: 'journeys_step_entered_track'
    }
  ],

  actions: {
    sendCustomEvent
  }
}

export default destination
