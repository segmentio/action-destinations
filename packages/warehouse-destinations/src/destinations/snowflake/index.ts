import type { WarehouseDestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { defaultValues } from '@segment/actions-core'
import aududienceDefaultFields from './sendCustomEvent/audience-default-fields'

import sendCustomEvent from './sendCustomEvent'

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
        ...defaultValues(aududienceDefaultFields)
      },
      type: 'specificEvent',
      eventSlug: 'warehouse_entity_added_track'
    },
    {
      name: 'Linked Audience Associated Entity Removed',
      partnerAction: 'sendCustomEvent',
      mapping: {
        ...defaultValues(sendCustomEvent.fields),
        ...defaultValues(aududienceDefaultFields)
      },
      type: 'specificEvent',
      eventSlug: 'warehouse_entity_removed_track'
    },
    {
      name: 'Linked Audience Profile Entered',
      partnerAction: 'sendCustomEvent',
      mapping: {
        ...defaultValues(sendCustomEvent.fields),
        ...defaultValues(aududienceDefaultFields)
      },
      type: 'specificEvent',
      eventSlug: 'warehouse_audience_entered_track'
    },
    {
      name: 'Linked Audience Profile Exited',
      partnerAction: 'sendCustomEvent',
      mapping: {
        ...defaultValues(sendCustomEvent.fields),
        ...defaultValues(aududienceDefaultFields)
      },
      type: 'specificEvent',
      eventSlug: 'warehouse_audience_exited_track'
    }
  ],

  actions: {
    sendCustomEvent
  }
}

export default destination
