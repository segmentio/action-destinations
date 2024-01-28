import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Post to Accoil',
  description: 'Send Data to Accoil Analytics',
  defaultSubscription: 'type = "track"',
  fields: {},
  perform: (request, data) => {
    return request('https://in.accoil.com/segment', {
      method: 'post',
      json: data.payload
    })
  }
}

export default action
