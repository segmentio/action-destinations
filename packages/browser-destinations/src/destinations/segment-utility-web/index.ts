import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'

import throttle from './throttle'

export type SegmentUtilityInstance = {
  eventMap: Record<string, { lastSent: number; receivedSinceLastSent: number }>
}

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, SegmentUtilityInstance> = {
  name: 'Segment Utility Web',
  slug: 'actions-segment-utility-web',
  mode: 'device',

  settings: {
    throttleTime: {
      label: 'Throttle time',
      description: 'Amount of time to wait before sending the same event again.',
      type: 'number',
      default: 3000
    },
    passThroughRate: {
      label: 'Pass through rate',
      description: 'Percentage of events to pass through while waiting for the throttle time to expire.',
      type: 'number',
      default: 0.1
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
