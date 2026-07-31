import type { WarehouseDestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import sendCustomEvent from './sendCustomEvent'

const destination: WarehouseDestinationDefinition<Settings> = {
  name: 'Test Warehouse',
  slug: 'testwarehouse',
  mode: 'warehouse',
  description: 'Test warehouse destination for testing actions destination bot',

  settings: {
    warehouseId: {
      label: 'Warehouse ID',
      description: 'The ID of the existing Test Warehouse instance to use.',
      type: 'string',
      required: true
    }
  },

  actions: {
    sendCustomEvent
  }
}

export default destination
