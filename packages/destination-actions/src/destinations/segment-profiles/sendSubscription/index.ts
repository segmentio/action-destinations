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
  subscriptionGroups
} from '../segment-properties'
import { InvalidEndpointSelectedThrowableError, MissingUserOrAnonymousIdThrowableError } from '../errors'
import { generateSegmentAPIAuthHeaders } from '../helperFunctions'
import { SEGMENT_ENDPOINTS } from '../properties'

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
  title: 'SendSubscriptions',
  description:
    'Send an identify call to Segment’s tracking API. This is used to tie your users to their actions and record traits about them.',
  defaultSubscription: 'type = "identify"',
  fields: {
    engage_space,
    user_id,
    anonymous_id,
    //group_id,
    traits,
    email,
    phone,
    email_subscription_status,
    sms_subscription_status,
    whatsapp_subscription_status,
    subscriptionGroups
  },
  perform: (request, { payload, settings }) => {
    if (!payload.anonymous_id && !payload.user_id) {
      throw MissingUserOrAnonymousIdThrowableError
    }

    const getStatus = (subscriptionStatus: string | null | undefined): string => {
      if (subscriptionStatus === 'true' || subscriptionStatus === 'SUBSCRIBED') {
        return 'SUBSCRIBED'
      }
      if (subscriptionStatus === 'false' || subscriptionStatus === 'UNSUBSCRIBED') {
        return 'UNSUBSCRIBED'
      }
      return 'DID_NOT_SUBSCRIBE'
    }

    const messaging_subscriptions: MessagingSubscription[] = []

    if (payload?.email) {
      //console.log('Initial Payload:', JSON.stringify(payload, null, 2))

      const emailSubscription: MessagingSubscription = {
        key: payload.email,
        type: 'EMAIL',
        status: getStatus(payload.email_subscription_status)
      }
      console.log('before groupSubscriptions:', JSON.stringify(emailSubscription, null, 2))

      if (payload.subscriptionGroups && typeof payload.subscriptionGroups === 'object') {
        const formattedGroups = Object.entries(payload.subscriptionGroups)
          .filter(([name, status]) => name !== undefined && status !== undefined)
          .map(([name, status]) => ({
            name: String(name),
            status: getStatus(String(status))
          }))
        emailSubscription.groups = formattedGroups
      }

      //console.log('after groupSubscriptions:', JSON.stringify(emailSubscription, null, 2))
      messaging_subscriptions.push(emailSubscription)
    }

    if (payload?.phone) {
      if (payload.sms_subscription_status !== undefined) {
        messaging_subscriptions.push({
          key: payload.phone,
          type: 'SMS',
          status: getStatus(payload.sms_subscription_status)
        })
      }

      if (payload.whatsapp_subscription_status !== undefined) {
        messaging_subscriptions.push({
          key: payload.phone,
          type: 'WHATSAPP',
          status: getStatus(payload.whatsapp_subscription_status)
        })
      }
    }

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

    const subscriptionPayload: Object = {
      userId: payload?.user_id,
      anonymousId: payload?.anonymous_id,
      traits: {
        ...payload?.traits
      },
      context: {
        messaging_subscriptions,
        externalIds
      },
      integrations: {
        // Setting 'integrations.All' to false will ensure that we don't send events
        // to any destinations which is connected to the Segment Profiles space.
        All: false
      }
    }

    //Throw an error if endpoint is not defined or invalid
    if (!settings.endpoint || !(settings.endpoint in SEGMENT_ENDPOINTS)) {
      throw InvalidEndpointSelectedThrowableError
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
