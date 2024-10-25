import { SegmentUtilitiesInstance } from '..'
import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: BrowserActionDefinition<Settings, SegmentUtilitiesInstance, Payload> = {
  title: 'Throttle by event name',
  description: 'Throttle events sent to Segment. Throttling is on a per event name basis.',
  platform: 'web',
  defaultSubscription: 'type = "track"',
  fields: {
    passThroughCount: {
      label: 'Number of events to pass through',
      description: 'Override the global pass through count.',
      type: 'integer',
      allowNull: true
    },
    throttleWindow: {
      label: 'Throttle time',
      description: 'Override the global throttle time.',
      type: 'number',
      allowNull: true
    }
  },
  lifecycleHook: 'before',
  perform: ({ eventMap }, data) => {
    const { context, settings, payload } = data

    const overridePassThroughCount = isNaN(Number(payload.passThroughCount))
      ? undefined
      : Number(payload.passThroughCount)
    const overrideThrottleWindow = isNaN(Number(payload.throttleWindow)) ? undefined : Number(payload.throttleWindow)

    const passThroughCount = overridePassThroughCount ?? settings.passThroughCount ?? 1
    const throttleWindow = overrideThrottleWindow ?? settings.throttleWindow ?? 0
    const event = context.event.event

    if (!event) {
      return
    }

    if (eventMap[event]) {
      const { windowStarted } = eventMap[event]
      const now = Date.now()
      if (now - windowStarted < throttleWindow) {
        // within the throttle window
        eventMap[event].receivedCount++
      } else {
        eventMap[event] = {
          // reset the window
          windowStarted: Date.now(),
          receivedCount: 1
        }
      }
    } else {
      // first time we've seen this event, start the window
      eventMap[event] = {
        windowStarted: Date.now(),
        receivedCount: 1
      }
    }

    if (eventMap[event].receivedCount > passThroughCount) {
      context.updateEvent('integrations', { ...context.event.integrations, 'Segment.io': false })
    }
  }
}

export default action
