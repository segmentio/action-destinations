import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getEndpointByRegion } from '../regional-endpoints'
import { commonFields } from '../common-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Event',
  description: 'Send entire event payload to Gainsight PX',
  fields: { ...commonFields },
  perform: (request, { payload, settings }) => {
    return request(getEndpointByRegion('track', settings.dataCenter), {
      method: 'post',
      json: payload.segmentEvent
    })
  }
}

export default action
