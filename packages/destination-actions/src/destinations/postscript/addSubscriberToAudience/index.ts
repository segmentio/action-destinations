import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add Subscriber to Audience',
  description: 'Adds audience data to Postscript subscriber as a custom property',
  defaultSubscription: 'event = "Audience Entered" or event = "Audience Exited"',
  fields: {},
  perform: (request, data) => {
    // Make your partner api request here!
    return request('https://example.com', {
      method: 'post',
      json: data.payload
    })
  }
}

export default action
