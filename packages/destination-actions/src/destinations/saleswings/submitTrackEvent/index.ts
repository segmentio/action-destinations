import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { Event, TrackingEvent } from '../api'
import { userId, anonymousId, email, url, referrerUrl, userAgent, timestamp, kind, data, values } from '../fields'
import { convertLeadRefs, convertValues, convertTimestamp } from '../converter'
import { perform, performBatch } from '../common'

const convertEvent = (payload: Payload): Event | undefined => {
  const leadRefs = convertLeadRefs(payload)
  if (leadRefs.length == 0) return undefined
  return new TrackingEvent({
    leadRefs,
    kind: payload.kind,
    data: payload.data,
    url: payload.url,
    referrerUrl: payload.referrerUrl,
    userAgent: payload.userAgent,
    timestamp: convertTimestamp(payload.timestamp),
    values: convertValues(payload.values)
  })
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Submit Track Event',
  description:
    'Send your Segment Track events to SalesWings to use them for tagging, scoring and prioritising your leads.',
  defaultSubscription: 'type = "track"',
  fields: {
    kind: kind('Track'),
    data: data({ '@path': '$.event' }),
    userId,
    anonymousId,
    email,
    url,
    referrerUrl,
    userAgent,
    timestamp,
    values: values({ '@path': '$.properties' })
  },
  perform: perform(convertEvent),
  performBatch: performBatch(convertEvent)
}

export default action
