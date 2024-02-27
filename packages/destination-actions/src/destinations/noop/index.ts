import { defaultValues, DestinationDefinition, Preset } from '@segment/actions-core'
import type { Settings } from './generated-types'

import noop from './noop'

const presets: Preset[] = [
  {
    name: 'Track Event',
    subscribe: 'type = "track"',
    partnerAction: 'noop',
    mapping: defaultValues(noop.fields),
    type: 'automatic'
  }
]

const destination: DestinationDefinition<Settings> = {
  name: 'NOOP',
  slug: 'actions-noop',
  mode: 'cloud',
  description: 'A NOOP destination used for private internal services.',
  presets: presets,
  actions: {
    noop
  }
}

export default destination
