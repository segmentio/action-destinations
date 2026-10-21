import { BrazeDestinationClient } from '../braze-types'
import type { ID, SegmentEvent, User } from '@segment/analytics-next'
import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
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

const BRAZE_INTEGRATION_NAMES = ['Braze Web Mode (Actions)', 'Braze Cloud Mode (Actions)', 'Appboy']
// The integration key the SDK Authentication signature is read from (see updateUserProfile).
const SDK_AUTH_INTEGRATION_NAME = 'Braze Web Mode (Actions)'

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// When the event is being sent on, decide whether to leave the caller's options object under
// this integration key untouched instead of replacing it with `true`. Only this destination's
// own key carries the SDK Authentication signature, so only that key is kept.
function shouldKeepSdkAuthOptions(
  name: string,
  existing: unknown,
  eventWillBeSent: boolean,
  sdkAuthEnabled: boolean
): existing is Record<string, unknown> {
  return eventWillBeSent && sdkAuthEnabled && name === SDK_AUTH_INTEGRATION_NAME && isObject(existing)
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

const action: BrowserActionDefinition<Settings, BrazeDestinationClient, Payload> = {
  title: 'Debounce Middleware',
  description:
    'When enabled, it ensures that only events where at least one changed trait value are sent to Braze, and events with duplicate traits are not sent. Debounce functionality requires a frontend client to work. Therefore, it cannot be used with server-side libraries or with Engage.',
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
    // Only customers who have turned SDK Authentication on need their options kept; for
    // everyone else debounce behaves exactly as before, so this change is opt-in like the
    // rest of SDK Authentication.
    const sdkAuthEnabled = Boolean(data.settings.enableSdkAuthentication)
    for (const name of BRAZE_INTEGRATION_NAMES) {
      // Writing `true` here would discard any per-destination options the caller set under
      // this key, and that is where the SDK Authentication signature is supplied. An object
      // is already truthy, so keeping it sends the event exactly as `true` would; only the
      // `false` skip signal has to overwrite. The other Braze keys keep the old `true`,
      // rather than carrying the token further with the event.
      const existingOptions = event.integrations?.[name]
      const integrationValue = shouldKeepSdkAuthOptions(name, existingOptions, shouldSend, sdkAuthEnabled)
        ? existingOptions
        : shouldSend
      ctx.updateEvent(`integrations.${name}`, integrationValue)
    }

    // Ensure analytics.user is defined
    cachedUser.id = analyticsUser.id()
    cachedUser.anonymousId = analyticsUser.anonymousId()
    cachedUser.traits = analyticsUser.traits()
  }
}

export default action
