import { SegmentUtilityInstance } from '..'
import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: BrowserActionDefinition<Settings, SegmentUtilityInstance, Payload> = {
  title: 'Throttle',
  description: 'Throttle events sent to Segment.',
  platform: 'web',
  defaultSubscription: 'type = "track"',
  fields: {},
  lifecycleHook: 'before',
  perform: ({ eventMap }, data) => {
    const { context, settings } = data
    const passThroughCount = settings.passThroughCount ?? 1
    const throttleWindow = settings.throttleWindow ?? 3000
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
