import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { userID, anonymousID, email, url, referrerUrl, userAgent, timestamp, kind, data, values } from '../fields'
import { perform, performBatch } from '../common'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Submit Track Event',
  description:
    'Send your Segment Track events to SalesWings to use them for tagging, scoring and prioritising your leads.',
  defaultSubscription: 'type = "track"',
  fields: {
    kind: kind('Track'),
    data: data({ '@path': '$.event' }),
    userID,
    anonymousID,
    email,
    url,
    referrerUrl,
    userAgent,
    timestamp,
    values: values({ '@path': '$.properties' })
  },
  perform: perform('track'),
  performBatch: performBatch('track')
}

export default action
