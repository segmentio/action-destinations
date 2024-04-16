import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  user_id,
  anonymous_id,
  timestamp,
  event_name,
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
  properties,
  traits,
  enable_batching
} from '../segment-properties'
import { MissingUserOrAnonymousIdThrowableError } from '../errors'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Track',
  description: 'Send a track call to Segment’s tracking API. This is used to record actions your users perform.',
  defaultSubscription: 'type = "track"',
  fields: {
    user_id,
    anonymous_id,
    timestamp,
    event_name,
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
    properties,
    traits,
    enable_batching
  },
  perform: (_request, { payload, statsContext }) => {
    if (!payload.anonymous_id && !payload.user_id) {
      throw MissingUserOrAnonymousIdThrowableError
    }

    const trackPayload: Object = convertPayload(payload)

    statsContext?.statsClient?.incr('tapi_internal', 1, [...statsContext.tags, 'action:sendTrack'])
    return { batch: [trackPayload] }
  },
  performBatch: (_request, { payload, statsContext }) => {
    const trackPayload = payload.map((data) => {
      if (!data.anonymous_id && !data.user_id) {
        throw MissingUserOrAnonymousIdThrowableError
      }
      return convertPayload(data)
    })

    statsContext?.statsClient?.incr('tapi_internal', 1, [...statsContext.tags, 'action:sendBatchTrack'])
    return { batch: trackPayload }
  }
}

function convertPayload(data: Payload) {
  return {
    userId: data?.user_id,
    anonymousId: data?.anonymous_id,
    timestamp: data?.timestamp,
    event: data?.event_name,
    context: {
      traits: {
        ...data?.traits
      },
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
    properties: {
      ...data?.properties
    },
    type: 'track'
  }
}

export default action
