import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { items, occurredAt, userIdentifiers } from '../properties'
import { API_URL, API_VERSION } from '../config'
import { formatProductItemsArray, buildECommEventObject } from '../functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add to Cart',
  description: 'Send Segment purchase events to Attentive.',
  defaultSubscription: 'type = "track" and event = "Product Added"',
  fields: {
    items: { ...items, description: 'List of items added to cart.' },
    userIdentifiers: { ...userIdentifiers },
    occurredAt: { ...occurredAt }
  },
  perform: (request, { payload }) => {
    const {
      items: rawProductItemsArray,
      occurredAt,
      userIdentifiers: { phone, email, clientUserId, ...customIdentifiers }
    } = payload

    const items = formatProductItemsArray(rawProductItemsArray)

    // Validate that at least one user identifier is provided
    if (!email && !phone && !clientUserId && Object.keys(customIdentifiers).length === 0) {
      throw new PayloadValidationError('At least one user identifier is required.')
    }

    const json = buildECommEventObject(items, occurredAt, phone, email, clientUserId, customIdentifiers)

    return request(`${API_URL}${API_VERSION}/events/ecommerce/add-to-cart`, {
      method: 'POST',
      json
    })
  }
}

export default action
