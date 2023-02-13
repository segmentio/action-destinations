import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { Event, TrackingEvent } from '../api'
import { userId, anonymousId, email, url, referrerUrl, userAgent, timestamp, kind, data, values } from '../fields'
import { convertLeadRefs, convertValues, convertTimestamp } from '../converter'
import { perform, performBatch } from '../common'

const convertEvent = (payload: Payload): Event | undefined => {
  return new TrackingEvent({
    leadRefs: convertLeadRefs(payload),
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
  title: 'Submit Identify Event',
  description:
    'Send your Segment Identify events to SalesWings to use them for tagging, scoring and prioritising your leads.',
  defaultSubscription: 'type = "identify"',
  fields: {
    kind: kind('Identify'),
    data: data({ '@path': '$.traits.email' }),
    userId,
    anonymousId,
    email: { ...email, required: true },
    url,
    referrerUrl,
    userAgent,
    timestamp,
    values: values({ '@path': '$.traits' })
  },
  perform: perform(convertEvent),
  performBatch: performBatch(convertEvent)
}

export default action
