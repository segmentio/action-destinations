import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  anonymous_id,
  engage_space,
  user_id,
  traits,
  email,
  phone,
  email_subscription_status,
  sms_subscription_status,
  whatsapp_subscription_status,
  subscription_groups,
  android_push_token,
  android_push_subscription_status,
  ios_push_subscription_status,
  ios_push_token
} from './subscription-properties'
import {
  InvalidEndpointSelectedError,
  InvalidSubscriptionStatusError,
  MissingExternalIdsError,
  MissingSubscriptionStatusesError,
  MissingAndroidPushTokenIfAndroidPushSubscriptionIsPresentError,
  MissingEmailIfEmailSubscriptionIsPresentError,
  MissingEmailSubscriptionIfSubscriptionGroupsIsPresentError,
  MissingIosPushTokenIfIosPushSubscriptionIsPresentError,
  MissingPhoneIfSmsOrWhatsappSubscriptionIsPresentError
} from '../errors'
import { generateSegmentAPIAuthHeaders } from '../helperFunctions'
import { SEGMENT_ENDPOINTS } from '../properties'

interface SubscriptionStatusConfig {
  status: string
  matchingStatuses: string[]
}

const subscriptionStatusConfig: SubscriptionStatusConfig[] = [
  { status: 'SUBSCRIBED', matchingStatuses: ['true', 'subscribed'] },
  { status: 'UNSUBSCRIBED', matchingStatuses: ['false', 'unsubscribed'] },
  { status: 'DID-NOT-SUBSCRIBE', matchingStatuses: ['did-not-subscribe', 'did_not_subscribe'] }
]

interface SupportedChannelsConfig {
  field: string
  externalId: string
  subscriptionFields: string[]
  channels: string[]
  groups: boolean
}

const supportedChannels: SupportedChannelsConfig[] = [
  {
    field: 'email',
    externalId: 'email',
    subscriptionFields: ['email_subscription_status'],
    channels: ['EMAIL'],
    groups: true
  },
  {
    field: 'phone',
    externalId: 'phone',
    subscriptionFields: ['sms_subscription_status', 'whatsapp_subscription_status'],
    channels: ['SMS', 'WHATSAPP'],
    groups: false
  },
  {
    field: 'android_push_token',
    externalId: 'android.push_token',
    subscriptionFields: ['android_push_subscription_status'],
    channels: ['ANDROID_PUSH'],
    groups: false
  },
  {
    field: 'ios_push_token',
    externalId: 'ios.push_token',
    subscriptionFields: ['ios_push_subscription_status'],
    channels: ['IOS_PUSH'],
    groups: false
  }
]

const INVALID_SUBSCRIPTION_STATUS = 'INVALID'
interface GroupSubscription {
  name?: string
  status?: string
}
interface MessagingSubscription {
  key: string
  type: string
  status: string
  groups?: GroupSubscription[]
}

interface ExtenalId {
  id: string
  type: string
  collection: string
  encoding: string
}
// Transforms a subscription status to one of the accepted values.
const getStatus = (subscriptionStatus: string | null | undefined): string | undefined => {
  const tempSubscriptionStatus = subscriptionStatus?.trim().toLowerCase()
  if (!tempSubscriptionStatus) {
    return undefined
  }

  const status = subscriptionStatusConfig.find(
    ({ matchingStatuses }) => matchingStatuses.indexOf(tempSubscriptionStatus) > -1
  )

  if (status) {
    return status.status
  }
  return INVALID_SUBSCRIPTION_STATUS
}

const enrichExternalIds = (payload: Payload, externalIds: ExtenalId[]): ExtenalId[] => {
  for (const channel of supportedChannels) {
    const field = payload[channel.field as keyof typeof payload]
    if (field != undefined) {
      externalIds.push({
        id: field as string,
        type: channel.externalId,
        collection: 'users',
        encoding: 'none'
      })
    }
  }
  return externalIds
}

const enrichMessagingSubscriptions = (
  payload: Payload,
  messagingSubscriptions: MessagingSubscription[]
): MessagingSubscription[] => {
  for (const channel of supportedChannels) {
    const field = payload[channel.field as keyof typeof payload]
    for (const [index, subscriptionField] of channel.subscriptionFields.entries()) {
      const subscriptionValue = payload[subscriptionField as keyof typeof payload]
      const subscription = formatToMessagingSubscription(
        field as string,
        channel.channels[index],
        subscriptionValue as string
      )
      if (subscription && channel.groups) {
        //Handling Subscription Groups:
        if (
          payload.subscription_groups &&
          typeof payload.subscription_groups === 'object' &&
          Object.keys(payload.subscription_groups).length > 0
        ) {
          const formattedGroups = Object.entries(payload.subscription_groups)
            .filter(([name, status]) => name !== undefined && status !== undefined)
            .map(([name, status]) => ({
              name: String(name),
              status: getStatus(String(status))
            }))
          subscription.groups = formattedGroups
        }
      }
      if (subscription) messagingSubscriptions.push(subscription)
    }
  }
  return messagingSubscriptions
}

const validateSubscriptions = (payload: Payload) => {
  // Throws an error if none of the subscription related externalId fields are undefined
  if (
    !(
      payload.anonymous_id ||
      payload.user_id ||
      payload.email ||
      payload.phone ||
      payload.android_push_token ||
      payload.ios_push_token
    )
  ) {
    throw MissingExternalIdsError
  }

  // Throws an error if none of the subscription statues fields are undefined
  if (
    !(
      payload.email_subscription_status ||
      payload.whatsapp_subscription_status ||
      payload.sms_subscription_status ||
      payload.android_push_subscription_status ||
      payload.ios_push_subscription_status
    )
  ) {
    throw MissingSubscriptionStatusesError
  }

  if (!payload.email && payload.email_subscription_status) {
    throw MissingEmailIfEmailSubscriptionIsPresentError
  }

  if (
    payload.subscription_groups &&
    !payload.email_subscription_status &&
    Object.keys(payload.subscription_groups).length > 0
  ) {
    throw MissingEmailSubscriptionIfSubscriptionGroupsIsPresentError
  }

  if (!payload.phone && (payload.sms_subscription_status || payload.whatsapp_subscription_status)) {
    throw MissingPhoneIfSmsOrWhatsappSubscriptionIsPresentError
  }

  if (!payload.android_push_token && payload.android_push_subscription_status) {
    throw MissingAndroidPushTokenIfAndroidPushSubscriptionIsPresentError
  }

  if (!payload.ios_push_token && payload.ios_push_subscription_status) {
    throw MissingIosPushTokenIfIosPushSubscriptionIsPresentError
  }

  // Only time we should not make a identify call is if none of the subscription status is valid
  if (
    payload.email_subscription_status &&
    getStatus(payload.email_subscription_status) == INVALID_SUBSCRIPTION_STATUS &&
    payload.sms_subscription_status &&
    getStatus(payload.sms_subscription_status) == INVALID_SUBSCRIPTION_STATUS &&
    payload.whatsapp_subscription_status &&
    getStatus(payload.whatsapp_subscription_status) == INVALID_SUBSCRIPTION_STATUS &&
    payload.ios_push_subscription_status &&
    getStatus(payload.ios_push_subscription_status) == INVALID_SUBSCRIPTION_STATUS &&
    payload.android_push_subscription_status &&
    getStatus(payload.android_push_subscription_status) == INVALID_SUBSCRIPTION_STATUS
  ) {
    throw InvalidSubscriptionStatusError
  }
}

// A helper function to create a messaging subscription object and add it to a list.
const formatToMessagingSubscription = (
  key: string,
  type: string,
  status: string | null | undefined
): MessagingSubscription | undefined => {
  const tempStatus = getStatus(status)
  if (tempStatus) {
    return {
      key,
      type,
      status: tempStatus
    }
  }
  return undefined
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Subscriptions',
  description:
    'Send an identify call to Segment’s tracking API. This is used to get user channel subscription data into Engage.',
  defaultSubscription: 'type = "identify"',
  fields: {
    engage_space,
    user_id,
    anonymous_id,
    email,
    email_subscription_status,
    subscription_groups,
    phone,
    sms_subscription_status,
    whatsapp_subscription_status,
    android_push_token,
    android_push_subscription_status,
    ios_push_token,
    ios_push_subscription_status,
    traits
  },
  perform: (request, { payload, settings, features, statsContext }) => {
    //Throw an error if endpoint is not defined or invalid
    if (!settings.endpoint || !(settings.endpoint in SEGMENT_ENDPOINTS)) {
      throw InvalidEndpointSelectedError
    }
    // Before sending subscription data to Segment, a series of validations are done.
    validateSubscriptions(payload)
    // Enriches ExternalId's
    const externalIds: ExtenalId[] = enrichExternalIds(payload, [])
    // Enrich Messaging Subscriptions
    const messagingSubscriptions: MessagingSubscription[] = enrichMessagingSubscriptions(payload, [])
    const subscriptionPayload: Object = {
      userId: payload?.user_id,
      anonymousId: payload?.anonymous_id,
      traits: {
        ...payload?.traits
      },
      context: {
        messaging_subscriptions: messagingSubscriptions,
        externalIds,
        messaging_subscriptions_retl: true
      },
      integrations: {
        // Setting 'integrations.All' to false will ensure that we don't send events
        // to any destinations which is connected to the Segment Profiles space
        All: false
      }
    }

    if (features && features['actions-segment-profiles-tapi-internal-enabled']) {
      statsContext?.statsClient?.incr('tapi_internal', 1, [...statsContext.tags, `action:sendSubscription`])
      const payload = { ...subscriptionPayload, type: 'identify' }
      return { batch: [payload] }
    }

    const selectedSegmentEndpoint = SEGMENT_ENDPOINTS[settings.endpoint].url

    return request(`${selectedSegmentEndpoint}/identify`, {
      method: 'POST',
      json: subscriptionPayload,
      headers: {
        authorization: generateSegmentAPIAuthHeaders(payload.engage_space)
      }
    })
  }
}

export default action
