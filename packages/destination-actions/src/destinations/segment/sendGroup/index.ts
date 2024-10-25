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
    consent
  },
  perform: (_request, { payload, statsContext }) => {
    if (!payload.anonymous_id && !payload.user_id) {
      throw MissingUserOrAnonymousIdThrowableError
    }
    const isValidConsentObject = validateConsentObject(payload?.consent)

    const groupPayload: Object = {
      userId: payload?.user_id,
      anonymousId: payload?.anonymous_id,
      groupId: payload?.group_id,
      timestamp: payload?.timestamp,
      messageId: payload?.message_id,
      context: {
        app: payload?.application,
        campaign: payload?.campaign_parameters,
        consent: isValidConsentObject ? { ...payload?.consent } : {},
        device: payload?.device,
        ip: payload?.ip_address,
        locale: payload?.locale,
        location: payload?.location,
        network: payload?.network,
        os: payload?.operating_system,
        page: payload?.page,
        screen: payload?.screen,
        userAgent: payload?.user_agent,
        timezone: payload?.timezone
      },
      traits: {
        ...payload?.traits
      },
      type: 'group'
    }

    // Returns transformed payload without snding it to TAPI endpoint.
    // The payload will be sent to Segment's tracking API internally.
    statsContext?.statsClient?.incr('tapi_internal', 1, [...statsContext.tags, 'action:sendGroup'])
    return { batch: [groupPayload] }
  }
}

export default action
