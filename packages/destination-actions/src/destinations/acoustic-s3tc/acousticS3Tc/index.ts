import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Acoustic S3TC',
  description: '',
  fields: {},
  perform: (request, data) => {
    // Make your partner api request here!
    request.length
    data.payload
    // return request('https://example.com', {
    //   method: 'post',
    //   json: data.payload
    // })
  }
}

export default action
