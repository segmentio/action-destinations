import type { WarehouseDestinationDefinition } from '@segment/actions-core'
import { Settings } from '../snowflake/generated-types'

const destination: WarehouseDestinationDefinition<Settings> = {
  name: 'Databricks',
  slug: 'databricks',
  mode: 'warehouse',

  settings: {},

  actions: {}
}

export default destination
