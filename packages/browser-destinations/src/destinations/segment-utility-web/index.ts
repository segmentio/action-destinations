import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'

import throttle from './throttle'

export type SegmentUtilityInstance = {
  eventMap: Record<string, { windowStarted: number; receivedCount: number }>
}

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, SegmentUtilityInstance> = {
  name: 'Segment Utility Web',
  slug: 'actions-segment-utility-web',
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
