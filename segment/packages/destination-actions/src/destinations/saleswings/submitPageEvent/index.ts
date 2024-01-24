import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { userID, anonymousID, url, referrerUrl, userAgent, timestamp } from '../fields'
import { perform, performBatch } from '../common'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Submit Page Event',
  description:
    'Send your Segment Page events to SalesWings to use them for tagging, scoring and prioritising your leads.',
  defaultSubscription: 'type = "page"',
  fields: {
    userID,
    anonymousID,
    url: { ...url, required: true },
    referrerUrl,
    userAgent,
    timestamp
  },
  perform: perform('page'),
  performBatch: performBatch('page')
}

export default action
