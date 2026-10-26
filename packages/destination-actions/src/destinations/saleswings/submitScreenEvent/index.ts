import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { userID, anonymousID, email, url, referrerUrl, userAgent, timestamp, kind, data, values } from '../fields'
import { perform, performBatch } from '../common'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Submit Screen Event',
  description:
    'Send your Segment Screen events to SalesWings to use them for tagging, scoring and prioritising your leads.',
  defaultSubscription: 'type = "screen"',
  fields: {
    kind: kind('Screen'),
    data: data({ '@path': '$.name' }),
    userID,
    anonymousID,
    email,
    url,
    referrerUrl,
    userAgent,
    timestamp,
    values: values({ '@path': '$.properties' })
  },
  perform: perform('screen'),
  performBatch: performBatch('screen')
}

export default action
