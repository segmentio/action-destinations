import type { WarehouseDestinationDefinition } from '@segment/actions-core'
import { Settings } from './generated-types'

const destination: WarehouseDestinationDefinition<Settings> = {
  name: 'Redshift',
  slug: 'redshift',
  mode: 'warehouse',

  settings: {},

  actions: {}
}

export default destination
