import { defaultValues, DestinationDefinition, Subscription } from '@segment/actions-core'
import type { Settings } from './generated-types'

import noop from './noop'

const presets: Subscription[] = [
  {
    name: 'Track Event',
    subscribe: 'type = "track"',
    partnerAction: 'noop',
    mapping: defaultValues(noop.fields)
  }
]

const destination: DestinationDefinition<Settings> = {
  name: 'NOOP (Actions)',
  slug: 'actions-noop-cloud',
  mode: 'cloud',
  description: 'A NOOP destination used for private internal services.',
  presets: presets,
  actions: {
    noop
  }
}

export default destination
