import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { data } from '../fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Page Load',
  description: 'Send a page load event to Microsoft Bing CAPI.',
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
