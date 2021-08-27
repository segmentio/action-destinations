import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Initiate Checkout',
  description: '',
  fields: {
    //none required
    //content_category: string
    //content_ids: array of integers or strings
    //contents: array of objects where each object requires an id: string and quantity: integer
    //currency: string
    //num_items: number
    //value: number
  },
  perform: (request, data) => {
    // Make your partner api request here!
    // return request('https://example.com', {
    //   method: 'post',
    //   json: data.payload
    // })
  }
}

export default action
