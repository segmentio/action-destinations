import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  user_id,
  anonymous_id,
  timestamp,
  page_name,
  page_category,
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
  message_id,
  enable_batching,
  consent,
  validateConsentObject
} from '../segment-properties'
import { MissingUserOrAnonymousIdThrowableError } from '../errors'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Page',
  description: 'Send a page call to Segment’s tracking API. This is used to track website page views.',
  defaultSubscription: 'type = "page"',
  fields: {
    user_id,
    anonymous_id,
    timestamp,
    page_name,
    page_category,
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
    message_id,
    enable_batching,
    consent
  },
  perform: (_request, { payload, statsContext }) => {
    if (!payload.anonymous_id && !payload.user_id) {
      throw MissingUserOrAnonymousIdThrowableError
    }

    const pagePayload: Object = convertPayload(payload)

    statsContext?.statsClient?.incr('tapi_internal', 1, [...statsContext.tags, 'action:sendPage'])
    return { batch: [pagePayload] }
  },
  performBatch: (_request, { payload, statsContext }) => {
    const pagePayload = payload.map((data) => {
      if (!data.anonymous_id && !data.user_id) {
        throw MissingUserOrAnonymousIdThrowableError
      }
      return convertPayload(data)
    })

    statsContext?.statsClient?.incr('tapi_internal', 1, [...statsContext.tags, 'action:sendBatchPage'])
    return { batch: pagePayload }
  }
}

function convertPayload(data: Payload) {
  const isValidConsentObject = validateConsentObject(data?.consent)

  return {
    userId: data?.user_id,
    anonymousId: data?.anonymous_id,
    timestamp: data?.timestamp,
    name: data?.page_name,
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
    properties: {
      name: data?.page_name,
      category: data?.page_category,
      path: data?.page?.path,
      referrer: data?.page?.referrer,
      search: data?.page?.search,
      title: data?.page?.title,
      url: data?.page?.url,
      ...data?.properties
    },
    type: 'page'
  }
}

export default action
