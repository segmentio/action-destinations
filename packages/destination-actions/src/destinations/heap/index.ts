import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import trackEvent from './trackEvent'
import { defaultValues } from '@segment/actions-core'
import identifyUser from './identifyUser'

// Used in the quick setup.
const presets: DestinationDefinition['presets'] = [
  {
    name: 'Track Calls',
    subscribe: 'type = "track" or type = "page" or type = "screen"',
    partnerAction: 'trackEvent',
    mapping: defaultValues(trackEvent.fields)
  },
  {
    name: 'Identify Calls',
    subscribe: 'type = "identify"',
    partnerAction: 'identifyUser',
    mapping: defaultValues(identifyUser.fields)
  }
]

const destination: DestinationDefinition<Settings> = {
  name: 'Heap Cloud (Actions)',
  slug: 'actions-heap-cloud',
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
    trackEvent,
    identifyUser
  }
}

export default destination
