import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { Event, PageVisitEvent } from '../api'
import { userId, anonymousId, url, referrerUrl, userAgent, timestamp } from '../fields'
import { convertLeadRefs, convertTimestamp } from '../converter'
import { perform, performBatch } from '../common'

const convertEvent = (payload: Payload): Event | undefined => {
  const leadRefs = convertLeadRefs(payload)
  if (leadRefs.length == 0) return undefined
  return new PageVisitEvent({
    leadRefs,
    url: payload.url,
    referrerUrl: payload.referrerUrl,
    userAgent: payload.userAgent,
    timestamp: convertTimestamp(payload.timestamp)
  })
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Submit Page Event',
  description:
    'Send your Segment Page events to SalesWings to use them for tagging, scoring and prioritising your leads.',
  defaultSubscription: 'type = "page"',
  fields: {
    userId,
    anonymousId,
    url: { ...url, required: true },
    referrerUrl,
    userAgent,
    timestamp
  },
  perform: perform(convertEvent),
  performBatch: performBatch(convertEvent)
}

export default action
