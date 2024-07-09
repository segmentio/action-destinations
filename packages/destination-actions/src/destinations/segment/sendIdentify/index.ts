import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  anonymous_id,
  application,
  campaign_parameters,
  device,
  group_id,
  ip_address,
  network,
  operating_system,
  page,
  timestamp,
  timezone,
  user_agent,
  user_id,
  screen,
  locale,
  location,
  traits,
  message_id,
  enable_batching,
  consent,
  validateConsentObject
} from '../segment-properties'
import { MissingUserOrAnonymousIdThrowableError } from '../errors'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Identify',
  description:
    'Send an identify call to Segment’s tracking API. This is used to tie your users to their actions and record traits about them.',
  defaultSubscription: 'type = "identify"',
  fields: {
    user_id,
    anonymous_id,
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
    group_id,
    traits,
    message_id,
    enable_batching,
    consent
  },
  perform: (_request, { payload, statsContext }) => {
    if (!payload.anonymous_id && !payload.user_id) {
      throw MissingUserOrAnonymousIdThrowableError
    }

    const identifyPayload = convertPayload(payload)
    statsContext?.statsClient?.incr('tapi_internal', 1, [...statsContext.tags, 'action:sendIdentify'])
    return { batch: [identifyPayload] }
  },
  performBatch: (_request, { payload, statsContext }) => {
    const identifyPayload = payload.map((data) => {
      if (!data.anonymous_id && !data.user_id) {
        throw MissingUserOrAnonymousIdThrowableError
      }
      return convertPayload(data)
    })

    statsContext?.statsClient?.incr('tapi_internal', 1, [...statsContext.tags, 'action:identifyBatchPayload'])
    return { batch: identifyPayload }
  }
}

function convertPayload(data: Payload) {
  const isValidConsentObject = validateConsentObject(data?.consent)
  return {
    userId: data?.user_id,
    anonymousId: data?.anonymous_id,
    timestamp: data?.timestamp,
    messageId: data?.message_id,
    context: {
      app: data?.application,
      campaign: data?.campaign_parameters,
      consent: isValidConsentObject ? { ...data?.consent } : {},
      device: data?.device,
      ip: data?.ip_address,
      locale: data?.locale,
      location: data?.location,
      network: data?.network,
      os: data?.operating_system,
      page: data?.page,
      screen: data?.screen,
      userAgent: data?.user_agent,
      timezone: data?.timezone,
      groupId: data?.group_id
    },
    traits: {
      ...data?.traits
    },
    type: 'identify'
  }
}

export default action
