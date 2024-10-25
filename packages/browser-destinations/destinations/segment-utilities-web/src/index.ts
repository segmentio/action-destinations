import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'

import throttle from './throttle'

export type SegmentUtilitiesInstance = {
  eventMap: Record<string, { windowStarted: number; receivedCount: number }>
}

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, SegmentUtilitiesInstance> = {
  name: 'Segment Utilities Web',
  slug: 'actions-segment-utilities-web',
  mode: 'device',

  settings: {
    throttleWindow: {
      label: 'Throttle time',
      description: 'The window of time in milliseconds to throttle events.',
      type: 'number',
      default: 3000
    },
    passThroughCount: {
      label: 'Number of events to pass through',
      description: 'Number of events to pass through while waiting for the throttle time to expire.',
      type: 'number',
      default: 1
    }
  },

  initialize: async () => {
    return {
      eventMap: {}
    }
  },

  actions: {
    throttle
  }
}

export default browserDestination(destination)
