import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  user_id,
  anonymous_id,
  group_id,
  timestamp,
  application,
  campaign_parameters,
  device,
  ip_address,
  locale,
  location,
  network,
  operating_system,
  page,
  screen,
  user_agent,
  timezone,
  traits,
  message_id,
  enable_batching,
  consent,
  validateConsentObject
} from '../segment-properties'
import { MissingUserOrAnonymousIdThrowableError } from '../errors'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Group',
  description: 'Send a group call to Segment’s tracking API. This is used to associate an individual user with a group',
  defaultSubscription: 'type = "group"',
  fields: {
    user_id,
    anonymous_id,
    group_id: { ...group_id, required: true },
    timestamp,
    application,
    campaign_parameters,
    device,
    ip_address,
    locale,
    location,
    network,
    operating_system,
    page,
    screen,
    user_agent,
    timezone,
    traits,
    message_id,
    enable_batching,
    consent
  },
  perform: (_request, { payload, statsContext }) => {
    if (!payload.anonymous_id && !payload.user_id) {
      throw MissingUserOrAnonymousIdThrowableError
    }

    const groupPayload: Object = convertPayload(payload)

    // Returns transformed payload without snding it to TAPI endpoint.
    // The payload will be sent to Segment's tracking API internally.
    statsContext?.statsClient?.incr('tapi_internal', 1, [...statsContext.tags, 'action:sendGroup'])
    return { batch: [groupPayload] }
  },
  performBatch: (_request, { payload, statsContext }) => {
    const groupPayload = payload.map((data) => {
      if (!data.anonymous_id && !data.user_id) {
        throw MissingUserOrAnonymousIdThrowableError
      }
      return convertPayload(data)
    })

    statsContext?.statsClient?.incr('tapi_internal', 1, [...statsContext.tags, 'action:sendBatchGroup'])
    return { batch: groupPayload }
  }
}

function convertPayload(data: Payload) {
  const isValidateConsentObject = validateConsentObject(data.consent)
  return {
    userId: data?.user_id,
    anonymousId: data?.anonymous_id,
    groupId: data?.group_id,
    timestamp: data?.timestamp,
    messageId: data?.message_id,
    context: {
      app: data?.application,
      campaign: data?.campaign_parameters,
      consent: isValidateConsentObject ? { ...data?.consent } : {},
      device: data?.device,
      ip: data?.ip_address,
      locale: data?.locale,
      location: data?.location,
      network: data?.network,
      os: data?.operating_system,
      page: data?.page,
      screen: data?.screen,
      userAgent: data?.user_agent,
      timezone: data?.timezone
    },
    traits: {
      ...data?.traits
    },
    type: 'group'
  }
}

export default action
