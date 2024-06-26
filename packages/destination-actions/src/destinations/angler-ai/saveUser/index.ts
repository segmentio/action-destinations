import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { baseURL, customersEndpoint } from '../routes'
import { userFields } from '../fields/userFields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Save User',
  description: 'Send a customer to Angler.',
  fields: {
    ...userFields
  },
  perform: (request, data) => {
    const payload = {
      src: 'SEGMENT',
      data: [data.payload]
    }
    return request(baseURL + customersEndpoint(data.settings.workspaceId), {
      method: 'post',
      json: payload
    })
  }
}

export default action
