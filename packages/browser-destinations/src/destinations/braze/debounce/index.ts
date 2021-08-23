import type appboy from '@braze/web-sdk'
import type { ID, SegmentEvent, User } from '@segment/analytics-next'
import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

type CachedUser = {
  id: ID
  anonymousId: ID
  traits: ReturnType<User['traits']> | null
}

let cachedUser: CachedUser = {
  id: undefined,
  anonymousId: undefined,
  traits: null
}

export function resetUserCache() {
  cachedUser = {
    id: undefined,
    anonymousId: undefined,
    traits: null
  }
}

function shouldSendToBraze(event: SegmentEvent) {
  if (event.userId && event.userId !== cachedUser.id) {
    return true
  }

  if (event.anonymousId && event.anonymousId !== cachedUser.anonymousId) {
    return true
  }

  const traits = event.traits ?? {}
  return JSON.stringify(cachedUser.traits) !== JSON.stringify(traits)
}

const action: BrowserActionDefinition<Settings, typeof appboy, Payload> = {
  title: 'Debounce Middleware',
  description:
    'When enabled, it ensures that only events where at least one changed trait value are sent to Braze, and events with duplicate traits are not sent.',
  platform: 'web',
  defaultSubscription: 'type = "identify" or type = "group"',
  fields: {},
  lifecycleHook: 'before',
  perform: (_client, data) => {
    const event = data.context.event
    const analyticsUser = data.analytics.user()
    const ctx = data.context

    // Only send the event to Braze if a trait has changed
    // Target all possible Braze integration names
    const shouldSend = shouldSendToBraze(event)
    ctx.updateEvent('integrations.Braze Web Mode (Actions)', shouldSend)
    ctx.updateEvent('integrations.Braze Cloud Mode (Actions)', shouldSend)
    ctx.updateEvent('integrations.Appboy', shouldSend)

    // Ensure analytics.user is defined
    cachedUser.id = analyticsUser.id()
    cachedUser.anonymousId = analyticsUser.anonymousId()
    cachedUser.traits = analyticsUser.traits()
  }
}

export default action
