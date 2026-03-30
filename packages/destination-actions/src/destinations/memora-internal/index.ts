import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import memoraDestination from '../memora'

const destination: DestinationDefinition<Settings> = {
  ...memoraDestination,
  name: 'Memora Internal',
  slug: 'actions-memora-internal'
}

export default destination
