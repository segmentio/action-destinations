import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { type, occurredAt, userIdentifiers, externalEventId, properties } from '../properties'
import { API_URL, API_VERSION } from '../config'
import { buildCustomEventObject } from '../functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Custom Events',
  description: 'Send Segment analytics events to Attentive.',
  defaultSubscription: 'type = "track"',
  fields: {
    type: { ...type },
    userIdentifiers: { ...userIdentifiers },
    occurredAt: { ...occurredAt },
    externalEventId: { ...externalEventId },
    properties: { ...properties, description: 'Metadata to associate with the event.' }
  },
  perform: (request, { payload }) => {
    const {
      externalEventId,
      type,
      properties,
      occurredAt,
      userIdentifiers: { phone, email, clientUserId, ...customIdentifiers }
    } = payload

    if (!email && !phone && !clientUserId && Object.keys(customIdentifiers).length === 0) {
      throw new PayloadValidationError('At least one user identifier is required.')
    }

    const json = buildCustomEventObject(
      type,
      properties,
      externalEventId,
      occurredAt,
      phone,
      email,
      clientUserId,
      customIdentifiers
    )

    return request(`${API_URL}${API_VERSION}/events/custom`, {
      method: 'post',
      json
    })
  }
}

export default action
