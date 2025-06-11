import type { WarehouseDestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

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

  actions: {
    sendCustomEvent
  }
}

export default destination
