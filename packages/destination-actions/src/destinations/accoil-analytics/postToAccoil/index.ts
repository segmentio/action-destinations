import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Post to Accoil',
  description: 'Send Data to Accoil Analytics',
  defaultSubscription: 'type = "track"',

  fields: {},
  perform: (request, { settings, payload }) => {
    console.log('POSTING DATA TO ACCOIL', settings)
    return request('https://in.accoil.com/segment', {
      method: 'post',
      json: payload
    })
  }
}

export default action
