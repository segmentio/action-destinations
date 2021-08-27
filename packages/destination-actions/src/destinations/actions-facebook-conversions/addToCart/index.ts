import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add to Cart',
  description: '',
  fields: {
    //none required
    //content_ids: array of integers or strings
    //content_name: string
    //content_type: string
    //contents: array of objects where each object requires an id: string and quantity: integer
    //currency: string
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
