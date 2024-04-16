import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { baseURL, ordersEndpoint } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Save Order',
  description: '',
  fields: {},
  perform: (request, data) => {
    const payload = {
      src: 'SEGMENT',
      data: [data.payload]
    }
    return request(baseURL + ordersEndpoint(data.settings.workspaceId), {
      method: 'post',
      json: payload
    })
  }
}

export default action
