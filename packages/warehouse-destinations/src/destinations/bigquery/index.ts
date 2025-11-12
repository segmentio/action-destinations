import type { WarehouseDestinationDefinition } from '@segment/actions-core'
import { Settings } from './generated-types'

const destination: WarehouseDestinationDefinition<Settings> = {
  name: 'BigQuery',
  slug: 'bigquery',
  mode: 'warehouse',

  settings: {},

  actions: {}
}

export default destination
