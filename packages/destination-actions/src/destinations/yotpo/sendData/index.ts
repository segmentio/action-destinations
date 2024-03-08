import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

// TODO: this is a test action, update it once we have better understanding of what it needs to do
const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Data',
  description: '',
  fields: {},
  defaultSubscription: 'type = "track"', //
  perform: (request, data) => {
    return request(`https://developers.yotpo.com/v2/${data.settings.store_id}/info`, {
      method: 'get'
    })
  }
}

export default action
