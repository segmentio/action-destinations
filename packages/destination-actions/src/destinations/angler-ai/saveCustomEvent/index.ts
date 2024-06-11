import type { ActionDefinition, InputField } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import saveBaseEvent from '../saveBaseEvent'
import saveCartEvent from '../saveCartEvent'
import saveCheckoutEvent from '../saveCheckoutEvent'
import saveCollectionEvent from '../saveCollectionEvent'
import saveSearchEvent from '../saveSearchEvent'
import saveFormEvent from '../saveFormEvent'
import saveProductEvent from '../saveProductEvent'
import type { Payload } from './generated-types'
import { transformPayload } from './transform-payload'
import { baseURL, eventsEndpoint } from '../routes'

function removeDefaults(fields: Record<string, InputField>) {
  return Object.entries(fields).reduce((acc, [key, field]) => {
    const { depends_on, ...fieldWithoutDefault } = field
    return { ...acc, [key]: fieldWithoutDefault }
  }, {})
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Save Custom Event',
  description: 'Save a custom event that may have any fields.',
  fields: {
    custom_event_name: {
      label: 'Custom Event Name',
      type: 'string',
      description: "Additional name for custom events if 'event_name' is 'custom_event'."
    },
    ...removeDefaults(saveCartEvent.fields),
    ...removeDefaults(saveCheckoutEvent.fields),
    ...removeDefaults(saveCollectionEvent.fields),
    ...removeDefaults(saveFormEvent.fields),
    ...removeDefaults(saveProductEvent.fields),
    ...removeDefaults(saveSearchEvent.fields),
    ...removeDefaults(saveBaseEvent.fields)
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
