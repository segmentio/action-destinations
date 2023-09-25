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
  InvalidEndpointSelectedThrowableError,
  // InvalidGroupSubscriptionStatusThrowableError,
  InvalidSubscriptionStatusThrowableError,
  MissingAndroidPushTokenIfAndroidPushSubscriptionIsPresentThrowableError,
  MissingEmailIfEmailSubscriptionIsPresentThrowableError,
  MissingEmailSubscriptionIfSubscriptionGroupsIsPresentThrowableError,
  MissingExternalIdsThrowableError,
  MissingIosPushTokenIfIosPushSubscriptionIsPresentThrowableError,
  MissingPhoneIfSmsOrWhatsappSubscriptionIsPresentThrowableError,
  MissingSubscriptionStatusesThrowableError,
  MissingUserOrAnonymousIdThrowableError
} from '../errors'
import { generateSegmentAPIAuthHeaders } from '../helperFunctions'
import { SEGMENT_ENDPOINTS } from '../properties'

interface SubscriptionStatusConfig {
  status: string
  matchingStatues: string[]
}

const subscriptionStatusConfig: SubscriptionStatusConfig[] = [
  { status: 'SUBSCRIBED', matchingStatues: ['true', 'subscribed'] },
  { status: 'UNSUBSCRIBED', matchingStatues: ['false', 'unsubscribed'] },
  { status: 'DID-NOT-SUBSCRIBE', matchingStatues: ['did-not-subscribe', 'did_not_subscribe'] }
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

// Transforms a subscription status to one of the accepted values.
const getStatus = (subscriptionStatus: string | null | undefined): string | undefined => {
  if (!subscriptionStatus) {
    return undefined
  }
  const status = subscriptionStatusConfig.find(
    ({ matchingStatues }) => matchingStatues.indexOf(subscriptionStatus) > -1
  )

  if (status) {
    return status.status
  }
  return INVALID_SUBSCRIPTION_STATUS
}

const validateSubscriptions = (payload: Payload) => {
  if (!payload.anonymous_id && !payload.user_id) {
    throw MissingUserOrAnonymousIdThrowableError
  }
  // Throws an error if none of the subscription related externalId fields are undefined
  if (!payload.email && !payload.phone && !payload.android_push_token && !payload.ios_push_token) {
    throw MissingExternalIdsThrowableError
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
    throw MissingSubscriptionStatusesThrowableError
  }

  if (!payload.email && payload.email_subscription_status) {
    throw MissingEmailIfEmailSubscriptionIsPresentThrowableError
  }

  if (
    payload.subscription_groups &&
    !payload.email_subscription_status &&
    Object.keys(payload.subscription_groups).length > 0
  ) {
    throw MissingEmailSubscriptionIfSubscriptionGroupsIsPresentThrowableError
  }

  if (!payload.phone && (payload.sms_subscription_status || payload.whatsapp_subscription_status)) {
    throw MissingPhoneIfSmsOrWhatsappSubscriptionIsPresentThrowableError
  }

  if (!payload.android_push_token && payload.android_push_subscription_status) {
    throw MissingAndroidPushTokenIfAndroidPushSubscriptionIsPresentThrowableError
  }

  if (!payload.ios_push_token && payload.ios_push_subscription_status) {
    throw MissingIosPushTokenIfIosPushSubscriptionIsPresentThrowableError
  }

  // Only time we should not make a identify call is if none of the subscription status is valid
  if (
    payload.email_subscription_status &&
    getStatus(payload.email_subscription_status.trim().toLowerCase()) == INVALID_SUBSCRIPTION_STATUS &&
    payload.sms_subscription_status &&
    getStatus(payload.sms_subscription_status.trim().toLowerCase()) == INVALID_SUBSCRIPTION_STATUS &&
    payload.whatsapp_subscription_status &&
    getStatus(payload.whatsapp_subscription_status.trim().toLowerCase()) == INVALID_SUBSCRIPTION_STATUS &&
    payload.ios_push_subscription_status &&
    getStatus(payload.ios_push_subscription_status.trim().toLowerCase()) == INVALID_SUBSCRIPTION_STATUS &&
    payload.android_push_subscription_status &&
    getStatus(payload.android_push_subscription_status.trim().toLowerCase()) == INVALID_SUBSCRIPTION_STATUS
  ) {
    throw InvalidSubscriptionStatusThrowableError
  }
}

// A helper function to create a messaging subscription object and add it to a list.
const formatToMessagingSubscription = (
  key: string,
  type: string,
  status: string | null | undefined
): MessagingSubscription | undefined => {
  const tempStatus = getStatus(status?.trim().toLowerCase())
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
    const messaging_subscriptions_retl = true
    const messaging_subscriptions: MessagingSubscription[] = []
    const externalIds: Array<{ id: string; type: string; collection: string; encoding: string }> = []
    //Throw an error if endpoint is not defined or invalid
    if (!settings.endpoint || !(settings.endpoint in SEGMENT_ENDPOINTS)) {
      throw InvalidEndpointSelectedThrowableError
    }
    // Before sending subscription data to Segment, a series of validations are done.
    validateSubscriptions(payload)

    if (payload?.email) {
      // email externalId
      externalIds.push({
        id: payload.email,
        type: 'email',
        collection: 'users',
        encoding: 'none'
      })
      //EMAIL Subscription Object
      if (payload.email_subscription_status) {
        const emailSubscription = formatToMessagingSubscription(
          payload.email,
          'EMAIL',
          payload.email_subscription_status?.trim().toLowerCase()
        )
        if (emailSubscription) {
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
                status: getStatus(String(status).trim().toLowerCase())
              }))
            emailSubscription.groups = formattedGroups
          }
          messaging_subscriptions.push(emailSubscription)
        }
      }
    }

    if (payload?.phone) {
      // phone externalId
      externalIds.push({
        id: payload.phone,
        type: 'phone',
        collection: 'users',
        encoding: 'none'
      })
      // SMS subscription object
      if (payload?.sms_subscription_status) {
        const smsSubscription = formatToMessagingSubscription(
          payload?.phone,
          'SMS',
          payload.sms_subscription_status?.trim().toLowerCase()
        )
        if (smsSubscription) {
          messaging_subscriptions.push(smsSubscription)
        }
      }
      // Whatsapp subscription object
      if (payload?.whatsapp_subscription_status) {
        const whatsappSubscription = formatToMessagingSubscription(
          payload?.phone,
          'WHATSAPP',
          payload.whatsapp_subscription_status?.trim().toLowerCase()
        )
        if (whatsappSubscription) {
          messaging_subscriptions.push(whatsappSubscription)
        }
      }
    }

    // ANDROID_PUSH subscription object
    if (payload?.android_push_token) {
      // android.push_token externalId
      externalIds.push({
        id: payload.android_push_token,
        type: 'android.push_token',
        collection: 'users',
        encoding: 'none'
      })
      if (payload?.android_push_subscription_status) {
        const androidPushTokenStatus = formatToMessagingSubscription(
          payload?.android_push_token,
          'ANDROID_PUSH',
          payload.android_push_subscription_status?.trim().toLowerCase()
        )
        if (androidPushTokenStatus) {
          messaging_subscriptions.push(androidPushTokenStatus)
        }
      }
    }

    // IOS_PUSH subscription object
    if (payload?.ios_push_token) {
      // ios.push_token externalId
      externalIds.push({
        id: payload.ios_push_token,
        type: 'ios.push_token',
        collection: 'users',
        encoding: 'none'
      })
      if (payload?.android_push_subscription_status) {
        const androidPushTokenStatus = formatToMessagingSubscription(
          payload?.ios_push_token,
          'IOS_PUSH',
          payload.android_push_subscription_status?.trim().toLowerCase()
        )
        if (androidPushTokenStatus) {
          messaging_subscriptions.push(androidPushTokenStatus)
        }
      }
    }

    const subscriptionPayload: Object = {
      userId: payload?.user_id,
      anonymousId: payload?.anonymous_id,
      traits: {
        ...payload?.traits
      },
      context: {
        messaging_subscriptions,
        externalIds,
        messaging_subscriptions_retl
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
