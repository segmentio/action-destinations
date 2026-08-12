import type { DestinationDefinition } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { HeapRegion } from './sendEvent/constants'
import sendEvent from './sendEvent'

const destination: DestinationDefinition<Settings> = {
  name: 'Heap Cloud',
  slug: 'actions-heap-cloud-server',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      appId: {
        label: 'App ID',
        description: 'The app_id corresponding to your Heap project.',
        type: 'string',
        required: true
      },
      region: {
        label: 'Data Residency Region',
        description: 'Select the region for your Heap environment.',
        type: 'string',
        choices: [
          { label: 'US (Default)', value: HeapRegion.US },
          { label: 'EU', value: HeapRegion.EU }
        ],
        default: HeapRegion.US,
        required: true
      }
    }
  },

  presets: [
    {
      name: 'Send Calls',
      subscribe: 'type = "track" or type = "page" or type = "screen" or type = "identify"',
      partnerAction: 'sendEvent',
      mapping: defaultValues(sendEvent.fields),
      type: 'automatic'
    }
  ],

  actions: {
    sendEvent
  }
}

export default destination
