import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getEndpointByRegion } from '../regional-endpoints'
import { commonFields } from '../common-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Page View',
  description: 'Send a page view event to Gainsight PX',
  defaultSubscription: 'type = "page"',
  fields: { ...commonFields },
  perform: (request, { payload, settings }) => {
    return request(getEndpointByRegion('track', settings.dataCenter), {
      method: 'post',
      json: payload.segmentEvent
    })
  }
}

export default action
