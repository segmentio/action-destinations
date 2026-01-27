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
    mapping: defaultValues(trackEvent.fields),
    type: 'automatic'
  },
  {
    name: 'Identify Calls',
    subscribe: 'type = "identify"',
    partnerAction: 'identifyUser',
    mapping: defaultValues(identifyUser.fields),
    type: 'automatic'
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
      },
      region: {
        label: 'Data Residency Region',
        description: 'Select the region for your Heap environment.',
        type: 'string',
        choices: [
          { label: 'US (Default)', value: 'US' },
          { label: 'EU', value: 'EU' }
        ],
        default: 'US',
        required: false
      }
    }
  },
  presets,
  actions: {
    trackEvent,
    identifyUser
  }
}

export default destination
