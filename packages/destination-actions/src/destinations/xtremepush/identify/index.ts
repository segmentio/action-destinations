import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify',
  description: 'Identify who is the customer',
  defaultSubscription: 'type = "identity"',
  fields: {},
  perform: (request, data) => {
    const host = data.settings.url.endsWith('/') ? data.settings.url.slice(0, -1) : data.settings.url;

    return request(host + '/api/integration/segment/handle', {
      method: 'post',
      json: data.payload
    })
  }
}

export default action
