import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import trackEvent from './trackEvent'
import { defaultValues } from '@segment/actions-core'

// Used in the quick setup.
// :TODO: Create presets for all supported actions.
const presets: DestinationDefinition['presets'] = [
  {
    name: 'Track Calls',
    subscribe: 'type = "track"',
    partnerAction: 'trackEvent',
    mapping: defaultValues(trackEvent.fields)
  }
]

const destination: DestinationDefinition<Settings> = {
  name: 'Heap',
  slug: 'actions-heap',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {
      appId: {
        label: 'App ID',
        description: 'The app_id corresponding to one of your projects.',
        type: 'string',
        required: true
      }
    }
  },
  // :TODO: Implement onDelete.
  presets,
  actions: {
    trackEvent
  }
}

export default destination
