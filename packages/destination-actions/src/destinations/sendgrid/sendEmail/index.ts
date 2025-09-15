import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { send } from './utils'
import { fields } from './fields'
import {
  dynamicTemplateId,
  dynamicIpPoolNames,
  dynamicDomain,
  dynamicGroupId,
  dynamicTemplateData
} from './dynamic-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Email with Dynamic Template',
  description: 'Send email to recipient(s) using a Dynamic Template in Sendgrid',
  fields,
  dynamicFields: {
    template_id: async (request, { settings }) => {
      return await dynamicTemplateId(request, settings)
    },
    ip_pool_name: async (request, { settings }) => {
      return await dynamicIpPoolNames(request, settings)
    },
    dynamic_template_data: {
      __keys__: async (request, { payload, settings }) => {
        return await dynamicTemplateData(request, payload, settings)
      }
    },
    domain: async (request, { settings }) => {
      return await dynamicDomain(request, settings)
    },
    group_id: async (request, { settings }) => {
      return await dynamicGroupId(request, settings)
    }
  },
  perform: async (request, { payload, settings }) => {
    return await send(request, payload, settings)
  }
}

export default action
