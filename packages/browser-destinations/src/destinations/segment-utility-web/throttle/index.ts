import { SegmentUtilityInstance } from '..'
import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: BrowserActionDefinition<Settings, SegmentUtilityInstance, Payload> = {
  title: 'Throttle',
  description: 'Throttle events to prevent duplicate events from being sent to Segment.',
  platform: 'web',
  defaultSubscription: 'type = "track"',
  fields: {},
  perform: ({ eventMap }, data) => {
    const { context, settings } = data
    const debounceRate = settings.passThroughRate ?? 0.0
    const debounceTime = settings.throttleTime ?? 3000
    const event = context.event.event
    let shouldBlock = false

    if (!event) {
      return
    }

    if (eventMap[event]) {
      const { lastSent, receivedSinceLastSent } = eventMap[event]
      const now = Date.now()
      if (now - lastSent < debounceTime) {
        if (1 / (receivedSinceLastSent + 1) > debounceRate) {
          eventMap[event].receivedSinceLastSent += 1
          shouldBlock = true
        }
      }
    }

    if (shouldBlock) {
      console.log('blocking', eventMap)
      context.updateEvent('integrations', { ...context.event.integrations, 'Segment.io': false })
    } else {
      eventMap[event] = { lastSent: Date.now(), receivedSinceLastSent: 0 }
    }
  }
}

export default action
