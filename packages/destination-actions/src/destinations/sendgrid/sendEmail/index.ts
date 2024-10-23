import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { send } from './utils'
import { fields } from './fields'
import { dynamicTemplateId } from './dynamic-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send email with Dynamic Template',
  description: 'Send email to recipient(s) using a Dynamic Template in Sendgrid',
  fields,
  dynamicFields: {
    template_id: async (request) => {
      return await dynamicTemplateId(request)
    }
  },
  perform: async (request, { payload }) => {
    return await send(request, payload)
  }
}

export default action
