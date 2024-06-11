import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { product } from '../fields'
import saveBaseEvent from '../saveBaseEvent'
import { transformPayload } from './transform-payload'
import { baseURL, eventsEndpoint } from '../routes'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Save Product Event',
  description: 'Save a product event.',
  fields: {
    productVariant: {
      ...product,
      label: 'Product Variant',
      description: 'Product Variant details'
    },
    ...saveBaseEvent.fields
  },
  perform: (request, data) => {
    const transformedPayload = transformPayload(data.payload)

    const payload = {
      src: 'SEGMENT',
      data: [transformedPayload]
    }
    return request(baseURL + eventsEndpoint(data.settings.workspaceId), {
      method: 'post',
      json: payload
    })
  }
}

export default action
