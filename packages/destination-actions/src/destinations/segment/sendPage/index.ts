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
  properties
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
    properties
  },
  perform: (_request, { payload }) => {
    if (!payload.anonymous_id && !payload.user_id) {
      throw MissingUserOrAnonymousIdThrowableError
    }

    const pagePayload: Object = {
      userId: payload?.user_id,
      anonymousId: payload?.anonymous_id,
      timestamp: payload?.timestamp,
      name: payload?.page_name,
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
      properties: {
        name: payload?.page_name,
        category: payload?.page_category,
        path: payload?.page?.path,
        referrer: payload?.page?.referrer,
        search: payload?.page?.search,
        title: payload?.page?.title,
        url: payload?.page?.url,
        ...payload?.properties
      }
    }

    return { batch: [{ ...pagePayload, type: 'page' }] }
  }
}

export default action
