import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from '../common-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description: 'Sets the user identity',
  defaultSubscription: 'type = "identify"',
  fields: {
    traits: {
      label: 'Group Properties',
      type: 'object',
      description: 'The properties to set on the group profile.',
      default: {
        '@path': '$.traits'
      }
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
