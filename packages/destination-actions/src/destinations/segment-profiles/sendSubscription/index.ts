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
} from '../segment-properties'
import {
  InvalidEndpointSelectedThrowableError,
  InvalidGroupSubscriptionStatusThrowableError,
  InvalidSubscriptionStatusThrowableError,
  MissingAndroidPushTokenIfAndroidPushSubscriptionIsPresentThrowableError,
  MissingEmailIfEmailSubscriptionIsPresentThrowableError,
  MissingEmailOrPhoneThrowableError,
  MissingEmailSubscriptionIfSubscriptionGroupsIsPresentThrowableError, MissingExternalIdsThrowableError,
  MissingIosPushTokenIfIosPushSubscriptionIsPresentThrowableError,
  MissingPhoneIfSmsOrWhatsappSubscriptionIsPresentThrowableError,
  MissingSubscriptionStatusesThrowableError,
  MissingUserOrAnonymousIdThrowableError
} from '../errors'
import { generateSegmentAPIAuthHeaders } from '../helperFunctions'
import { SEGMENT_ENDPOINTS } from '../properties'

const validateSubscriptions = (payload: Payload) => {
  if (!payload.anonymous_id && !payload.user_id) {
    throw MissingUserOrAnonymousIdThrowableError
  }

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

  if (!payload.email && !payload.phone && !payload.android_push_token && !payload.ios_push_token) {
    throw MissingExternalIdsThrowableError
  }

  if (!payload.phone && (payload.sms_subscription_status || payload.whatsapp_subscription_status)) {
    throw MissingPhoneIfSmsOrWhatsappSubscriptionIsPresentThrowableError
  }

  if (!payload.email && payload.email_subscription_status) {
    throw MissingEmailIfEmailSubscriptionIsPresentThrowableError
  }
  // Below should not happen as we can allow creation of phone without subscription status acttached

  // if (payload.phone && !payload.email && !(payload.sms_subscription_status || payload.whatsapp_subscription_status)) {
  //   throw MissingSmsOrWhatsappSubscriptionIfPhoneIsPresentThrowableError
  // }

  // if (payload.email && !payload.phone && !payload.email_subscription_status) {
  //   throw MissingEmailSubscriptionIfEmailIsPresentThrowableError
  // }

  if (payload.subscription_groups && !payload.email_subscription_status) {
    throw MissingEmailSubscriptionIfSubscriptionGroupsIsPresentThrowableError
  }

  if (!payload.android_push_token && payload.android_push_subscription_status) {
    throw MissingAndroidPushTokenIfAndroidPushSubscriptionIsPresentThrowableError
  }

  if (!payload.ios_push_token && payload.ios_push_subscription_status) {
    throw MissingIosPushTokenIfIosPushSubscriptionIsPresentThrowableError
  }

  const validStatuses = ['true', 'subscribed', 'false', 'unsubscribed', 'did_not_subscribe']

  //Validate global subscription statuses
  if (
    (payload.email_subscription_status &&
      !validStatuses.includes(payload.email_subscription_status.trim().toLowerCase())) ||
    (payload.sms_subscription_status &&
      !validStatuses.includes(payload.sms_subscription_status.trim().toLowerCase())) ||
    (payload.whatsapp_subscription_status &&
      !validStatuses.includes(payload.whatsapp_subscription_status.trim().toLowerCase())) ||
    (payload.ios_push_subscription_status &&
      !validStatuses.includes(payload.ios_push_subscription_status.trim().toLowerCase())) ||
    (payload.android_push_subscription_status &&
      !validStatuses.includes(payload.android_push_subscription_status.trim().toLowerCase()))
  ) {
    throw InvalidSubscriptionStatusThrowableError
  }

  // Validate the group subscription statuses
  if (payload.subscription_groups && typeof payload.subscription_groups === 'object') {
    Object.values(payload.subscription_groups).forEach((group) => {
      const groupSub: GroupSubscription = group as GroupSubscription
      if (groupSub.status && !validStatuses.includes(groupSub.status.trim().toLowerCase())) {
        throw InvalidGroupSubscriptionStatusThrowableError
      }
    })
  }
}

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

    // Before sending subscription data to Segment, a series of validations are done
    validateSubscriptions(payload)

    //TODO: Add email format and phone validations

    // A helper function to create a messaging subscription object and add it to a list.
    const addMessagingSubscription = (key: string, type: string, status: string | null | undefined) => {
      messaging_subscriptions.push({
        key,
        type,
        status: getStatus(status?.trim().toLowerCase())
      })
    }

    // Transforms a subscription status to one of the accepted values
    const getStatus = (subscriptionStatus: string | null | undefined): string => {
      if (subscriptionStatus === 'true' || subscriptionStatus === 'subscribed') {
        return 'subscribed'
      }
      if (subscriptionStatus === 'false' || subscriptionStatus === 'unsubscribed') {
        return 'unsubscribed'
      }
      if (subscriptionStatus === null || !subscriptionStatus || subscriptionStatus === '') {
        return 'did_not_subscribe'
      }
      throw InvalidSubscriptionStatusThrowableError
    }

    const messaging_subscriptions: MessagingSubscription[] = []

    //Creating the Email Subscription Object:
    if (payload?.email) {
      if (payload.email_subscription_status) {
        const emailSubscription: MessagingSubscription = {
          key: payload.email,
          type: 'EMAIL',
          status: getStatus(payload.email_subscription_status?.trim().toLowerCase())
        }

        //Handling Subscription Groups:
        if (payload.subscription_groups && typeof payload.subscription_groups === 'object') {
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

    payload?.phone &&
      payload?.sms_subscription_status !== undefined &&
      addMessagingSubscription(payload.phone, 'SMS', payload.sms_subscription_status)

    payload?.phone &&
      payload?.whatsapp_subscription_status !== undefined &&
      addMessagingSubscription(payload.phone, 'WHATSAPP', payload.whatsapp_subscription_status)

    payload?.android_push_token &&
      payload?.android_push_subscription_status !== undefined &&
      addMessagingSubscription(payload.android_push_token, 'ANDROID_PUSH', payload.android_push_subscription_status)

    payload?.ios_push_token &&
      payload?.ios_push_subscription_status !== undefined &&
      addMessagingSubscription(payload.ios_push_token, 'IOS_PUSH', payload.ios_push_subscription_status)

    const externalIds: Array<{ id: string; type: string; collection: string; encoding: string }> = []

    if (payload?.email) {
      externalIds.push({
        id: payload.email,
        type: 'email',
        collection: 'users',
        encoding: 'none'
      })
    }

    if (payload?.phone) {
      externalIds.push({
        id: payload.phone,
        type: 'phone',
        collection: 'users',
        encoding: 'none'
      })
    }

    if (payload?.android_push_token) {
      externalIds.push({
        id: payload.android_push_token,
        type: 'android_push',
        collection: 'users',
        encoding: 'none'
      })
    }

    if (payload?.ios_push_token) {
      externalIds.push({
        id: payload.ios_push_token,
        type: 'ios_push',
        collection: 'users',
        encoding: 'none'
      })
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

    //Throw an error if endpoint is not defined or invalid
    if (!settings.endpoint || !(settings.endpoint in SEGMENT_ENDPOINTS)) {
      throw InvalidEndpointSelectedThrowableError
    }

    if (features && features['actions-segment-profiles-tapi-internal-enabled']) {
      statsContext?.statsClient?.incr('tapi_internal', 1, [...statsContext.tags, `action:sendSubscription`])
      const payload = { ...subscriptionPayload, type: 'identify' }
      return { batch: [payload] }
    }

    const selectedSegmentEndpoint = SEGMENT_ENDPOINTS[settings.endpoint].url
    console.log('payload', JSON.stringify(subscriptionPayload, null, 2))
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
