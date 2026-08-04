import type { WarehouseDestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import sendCustomEvent from './sendCustomEvent'

const destination: WarehouseDestinationDefinition<Settings> = {
  name: 'Test Warehouse 2',
  slug: 'testwarehouse2',
  mode: 'warehouse',
  description: 'Throwaway warehouse destination for testing actions destination bot registration.',

  settings: {
    warehouseId: {
      label: 'Warehouse ID',
      description: 'The ID of the existing Test Warehouse 2 instance to use.',
      type: 'string',
      required: true
    }
  },

  actions: {
    sendCustomEvent
  }
}

export default destination
