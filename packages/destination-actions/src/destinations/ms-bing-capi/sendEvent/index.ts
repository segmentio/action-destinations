import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { data } from '../fields'
import { API_URL } from '../constants'
import { processHashing } from '../../../lib/hashing-utils'
import { v4 as uuidv4 } from '@lukeed/uuid'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Event',
  description: '',
  fields: {
    data: data
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
