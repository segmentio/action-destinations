import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import omit from 'lodash/omit'
import pick from 'lodash/pick'
import { enchargeIngestAPIURL } from '../utils'
import { commonFields, propertiesDefinition, userFieldsDefinition } from '../common-definitions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Page View',
  description: 'Track a website page visit.',
  defaultSubscription: 'type = "page"',
  fields: {
    properties: {
      ...propertiesDefinition.properties,
      description:
        "Custom properties to send with the pageview. Please note that URL, title, refererrer, path and search are automatically collected and don't have to be mapped here.",
      label: 'Page View Properties'
    },
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
