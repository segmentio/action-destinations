import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Offline Conversion',
  description: '',
  fields: {},
  perform: (request, data) => {
    return request('URL_to_send_data_to', {
      method: 'post',
      json: {
        data: data
      }
    })
  }
}

export default action
