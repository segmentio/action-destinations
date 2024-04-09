import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { customersEndpoint } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Save User',
  description: '',
  fields: {},
  perform: (request, data) => {
    const payload = {}
    return request(customersEndpoint(data.settings.workspaceId), {
      method: 'post',
      json: payload
    })
  }
}

export default action
