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
  traits
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
    traits
  },
  perform: (_request, { payload, statsContext }) => {
    if (!payload.anonymous_id && !payload.user_id) {
      throw MissingUserOrAnonymousIdThrowableError
    }

    const identifyPayload = {
      userId: payload?.user_id,
      anonymousId: payload?.anonymous_id,
      timestamp: payload?.timestamp,
      context: {
        app: payload?.application,
        campaign: payload?.campaign_parameters,
        device: payload?.device,
        ip: payload?.ip_address,
        locale: payload?.locale,
        location: payload?.location,
        network: payload?.network,
        os: payload?.operating_system,
        page: payload?.page,
        screen: payload?.screen,
        userAgent: payload?.user_agent,
        timezone: payload?.timezone,
        groupId: payload?.group_id
      },
      traits: {
        ...payload?.traits
      },
      type: 'identify'
    }

    statsContext?.statsClient?.incr('tapi_internal', 1, [...statsContext.tags, 'action:identifyPayload'])
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
  return {
    userId: data?.user_id,
    anonymousId: data?.anonymous_id,
    timestamp: data?.timestamp,
    context: {
      app: data?.application,
      campaign: data?.campaign_parameters,
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
