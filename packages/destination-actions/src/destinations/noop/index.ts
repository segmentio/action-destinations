import { defaultValues, DestinationDefinition, Subscription } from '@segment/actions-core'
import type { Settings } from './generated-types'

import noop from './noop'

const presets: Subscription[] = [
  {
    name: 'Track Event',
    subscribe: 'type = "track"',
    partnerAction: 'trackEvent',
    mapping: defaultValues(noop.fields)
  }
]

const destination: DestinationDefinition<Settings> = {
  name: 'Test',
  slug: 'actions-noop',
  mode: 'cloud',
  description: 'A NOOP destination used for private internal services.',
  presets: presets,
  actions: {
    noop
  }
}

export default destination
