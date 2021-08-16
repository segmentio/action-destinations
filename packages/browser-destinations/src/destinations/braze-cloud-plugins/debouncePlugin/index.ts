import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { ID, SegmentEvent, User } from '@segment/analytics-next'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

interface CachedUser {
  id?: ID
  anonymousId?: ID
  traits: null | ReturnType<User['traits']>
}

const cachedUser: CachedUser = {
  id: undefined,
  anonymousId: undefined,
  traits: null
}

function shouldSendToBraze(event: SegmentEvent) {
  if (event.userId !== cachedUser.id || event.anonymousId !== cachedUser.anonymousId) {
    return true
  }

  return JSON.stringify(cachedUser.traits) !== JSON.stringify(event.traits ?? {})
}

const action: BrowserActionDefinition<Settings, unknown, Payload> = {
  title: 'Debounce Plugin',
  description:
    'When enabled, ensures that only events where at least one trait changed are sent to Braze, and events with duplicate traits are not sent.',
  platform: 'web',
  hidden: true,
  defaultSubscription: 'type = "identify"',
  fields: {},
  lifecycleHook: 'before',
  perform: (_client, bundle) => {
    const event = bundle.context.event
    const user = bundle.analytics.user()
    const ctx = bundle.context

    // Only send the event to Braze if a trait has changed
    ctx.updateEvent('integrations.Braze Cloud Mode (Actions)', shouldSendToBraze(event))

    cachedUser.id = user.id()
    cachedUser.anonymousId = user.anonymousId()
    cachedUser.traits = user.traits()
  }
}

export default action
