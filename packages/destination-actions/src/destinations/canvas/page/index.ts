import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from '../common-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Page',
  description: 'Adds a page view record',
  defaultSubscription: 'type = "page"',
  fields: {
    name: {
      type: 'string',
      label: 'Name',
      description: 'Page name',
      required: false,
      default: { '@path': '$.name' }
    },
    properties: {
      type: 'object',
      label: 'Properties',
      description: 'Properties to associate with the page view',
      required: false,
      default: { '@path': '$.properties' }
    },
    ...commonFields
  },
  perform: (request, { payload }) => {
    return request('https://z17lngdoxi.execute-api.us-west-2.amazonaws.com/Prod/event', {
      method: 'post',
      json: payload
    })
  }
}

export default action
