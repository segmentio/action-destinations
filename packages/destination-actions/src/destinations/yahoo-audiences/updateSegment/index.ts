import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync To Yahoo Ads Segment',
  description: 'Sync Segment Audience to Yahoo Ads Segment',
  defaultSubscription: 'event = "Audience Entered" and event = "Audience Exited"',
  fields: {
    seg_id: {
      label: 'Yahoo Segment Id',
      description: 'The Id of Yahoo Segment',
      type: 'string',
      required: true
    }
  },
  perform: (request, { payload }) => {
    return request('https://dataxonline.yahoo.com/online/audience/', {
      method: 'POST',
      json: payload
    })
  }
}

export default action
