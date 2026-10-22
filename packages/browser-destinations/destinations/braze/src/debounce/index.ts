import { BrazeDestinationClient } from '../braze-types'
import type { ID, SegmentEvent, User } from '@segment/analytics-next'
import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

type CachedUser = {
  id: ID
  anonymousId: ID
  traits: ReturnType<User['traits']> | null
  // The last SDK Authentication signature seen, so a refreshed token counts as a change.
  sdkAuthSignature: string | undefined
}

let cachedUser: CachedUser = {
  id: undefined,
  anonymousId: undefined,
  traits: null,
  sdkAuthSignature: undefined
}

export function resetUserCache() {
  cachedUser = {
    id: undefined,
    anonymousId: undefined,
    traits: null,
    sdkAuthSignature: undefined
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

// The signature the caller supplied on this event, read from the same two places the Update User
// Profile mapping reads it by default. Anything but a non-empty string counts as no signature.
function getSdkAuthSignature(event: SegmentEvent): string | undefined {
  const options = event.integrations?.[SDK_AUTH_INTEGRATION_NAME]
  if (!isObject(options)) return undefined
  const signature = options.sdk_auth_signature ?? options.sdkAuthSignature
  return typeof signature === 'string' && signature.trim() !== '' ? signature : undefined
}

function shouldSendToBraze(event: SegmentEvent, sdkAuthEnabled: boolean) {
  if (event.userId && event.userId !== cachedUser.id) {
    return true
  }

  if (event.anonymousId && event.anonymousId !== cachedUser.anonymousId) {
    return true
  }

  // A refreshed token for the same user with the same traits still has to reach Braze, or it
  // keeps using the old one. An event without a signature is not a change.
  if (sdkAuthEnabled) {
    const signature = getSdkAuthSignature(event)
    if (signature !== undefined && signature !== cachedUser.sdkAuthSignature) {
      return true
    }
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

    // Only customers who have turned SDK Authentication on need their options kept or a
    // changed token treated as a change; for everyone else debounce behaves exactly as before,
    // so this is opt-in like the rest of SDK Authentication.
    const sdkAuthEnabled = Boolean(data.settings.enableSdkAuthentication)

    // Only send the event to Braze if a trait (or, with SDK Authentication on, the token) has changed
    // Target all possible Braze integration names
    const shouldSend = shouldSendToBraze(event, sdkAuthEnabled)
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
    if (sdkAuthEnabled) {
      cachedUser.sdkAuthSignature = getSdkAuthSignature(event) ?? cachedUser.sdkAuthSignature
    }
  }
}

export default action
