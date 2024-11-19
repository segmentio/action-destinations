import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { send } from './utils'
import { fields } from './fields'
import { dynamicCustomFields } from './dynamic-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description: 'Sync a Segment Engage Audience to a Sendgrid List',
  defaultSubscription: 'type = "identify" or type = "track"',
  fields,
  dynamicFields: {
    custom_fields: {
      __keys__: async (request) => {
        return await dynamicCustomFields(request)
      }
    },
  },
  perform: async (request, { payload }) => {
    const x = await dynamicCustomFields(request)
    console.log(JSON.stringify(x))  
    return await send(request, [payload])
  },
  performBatch: async (request, { payload }) => {
    return await send(request, payload)
  }
}

export default action
