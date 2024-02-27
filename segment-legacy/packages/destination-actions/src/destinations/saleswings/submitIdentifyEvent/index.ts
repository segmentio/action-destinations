import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { userID, anonymousID, email, url, referrerUrl, userAgent, timestamp, kind, data, values } from '../fields'
import { perform, performBatch } from '../common'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Submit Identify Event',
  description:
    'Send your Segment Identify events to SalesWings to use them for tagging, scoring and prioritising your leads.',
  defaultSubscription: 'type = "identify"',
  fields: {
    kind: kind('Identify'),
    data: data({ '@path': '$.traits.email' }),
    userID,
    anonymousID,
    email: { ...email, required: true },
    url,
    referrerUrl,
    userAgent,
    timestamp,
    values: values({ '@path': '$.traits' })
  },
  perform: perform('identify'),
  performBatch: performBatch('identify')
}

export default action
