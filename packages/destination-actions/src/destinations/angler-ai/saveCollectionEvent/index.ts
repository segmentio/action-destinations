import type { ActionDefinition } from '@segment/actions-core'
import { cartFields } from '../fields/cartFields'
import { collectionFields } from '../fields/collectionFields'
import { commonFields } from '../fields/commonFields'
import { customerFields } from '../fields/customerFields'
import type { Settings } from '../generated-types'
import { baseURL, eventsEndpoint } from '../routes'
import type { Payload } from './generated-types'
import { transformPayload } from './transform-payload'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Save Collection Event',
  description: 'Save a collection event.',
  fields: {
    ...commonFields,
    ...customerFields,
    ...cartFields,
    ...collectionFields,
    eventName: {
      label: 'Collection Event Name',
      type: 'string',
      description: 'The name of the Collection Event to track.',
      required: true,
      readOnly: true,
      choices: [{ label: 'collection_viewed', value: 'collection_viewed' }],
      default: 'collection_viewed'
    }
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
