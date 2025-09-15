import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { fields } from './fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Message',
  description: 'This operation creates and sends out messages to the specified recipients.',
  fields,
  perform: () => {
    return "hello"
    // Make your partner api request here!
    // return request('https://example.com', {
    //   method: 'post',
    //   json: data.payload
    // })
  }
}

export default action
