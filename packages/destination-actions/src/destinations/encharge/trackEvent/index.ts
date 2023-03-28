import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import omit from 'lodash/omit'
import pick from 'lodash/pick'
import { enchargeIngestAPIURL } from '../utils'
import { commonFields, propertiesDefinition, userFieldsDefinition } from '../common-definitions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Track an event in Encharge for a known or anonymous person.',
  defaultSubscription: 'type = "track"',
  fields: {
    event: {
      type: 'string',
      required: true,
      description: 'The name of the event.',
      label: 'Event Name',
      default: { '@path': '$.event' }
    },
    ...propertiesDefinition,
    ...userFieldsDefinition,
    ...commonFields
  },
  perform: (request, data) => {
    const payload = {
      ...omit(data.payload, ['ip', 'userAgent', 'campaign', 'page', 'location', 'user', 'groupId']),
      context: pick(data.payload, ['ip', 'userAgent', 'campaign', 'page', 'location', 'groupId']),
      user: {
        email: data.payload.email,
        userId: data.payload.userId,
        segmentAnonymousId: data.payload.segmentAnonymousId,
        ...(data.payload.userFields || {}) // traits
      }
    }
    return request(enchargeIngestAPIURL, {
      method: 'post',
      json: payload
    })
  }
}

export default action
