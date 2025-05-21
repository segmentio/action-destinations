import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { send } from './utils'
import { fields } from './fields'
import { dynamicCustomFields } from './dynamic-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description: 'Sync users to a Sendgrid List',
  defaultSubscription: 'type = "identify" or type = "track"',
  fields,
  dynamicFields: {
    custom_text_fields: {
      __keys__: async (request, { payload }) => {
        return await dynamicCustomFields(request, payload, 'Text')
      }
    },
    custom_number_fields: {
      __keys__: async (request, { payload }) => {
        return await dynamicCustomFields(request, payload, 'Number')
      }
    },
    custom_date_fields: {
      __keys__: async (request, { payload }) => {
        return await dynamicCustomFields(request, payload, 'Date')
      }
    }
  },
  perform: async (request, { payload }) => {
    return await send(request, [payload], false)
  },
  performBatch: async (request, { payload }) => {
    return await send(request, payload, true)
  }
}

export default action
