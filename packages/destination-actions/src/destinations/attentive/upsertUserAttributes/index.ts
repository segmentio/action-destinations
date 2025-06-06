import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { userIdentifiers, externalEventId, occurredAt, properties } from '../fields'
import { API_URL, API_VERSION } from '../constants'
import { formatUpsertUserAttributesJSON, validate } from '../functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Custom Attributes',
  description: 'Upserts custom attributes on a user profile in Attentive.',
  defaultSubscription: 'type = "identify"',
  fields: {
    userIdentifiers,
    occurredAt,
    externalEventId,
    properties: {
      ...properties,
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (request, { payload }) => {
    validate(payload)
    return request(`${API_URL}/${API_VERSION}/attributes/custom`, {
      method: 'post',
      json: formatUpsertUserAttributesJSON(payload)
    })
  }
}

export default action
