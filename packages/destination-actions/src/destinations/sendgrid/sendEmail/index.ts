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
  title: 'Send email with Dynamic Template',
  description: 'Send email to recipient(s) using a Dynamic Template in Sendgrid',
  fields,
  dynamicFields: {
    template_id: async (request) => {
      return await dynamicTemplateId(request)
    },
    ip_pool_name: async (request) => {
      return await dynamicIpPoolNames(request)
    },
    dynamic_template_data: {
      __keys__: async (request, { payload }) => {
        return await dynamicTemplateData(request, payload)
      }
    },
    domain: async (request) => {
      return await dynamicDomain(request)
    },
    group_id: async (request) => {
      return await dynamicGroupId(request)
    }
  },
  perform: async (request, { payload }) => {
    return await send(request, payload)
  }
}

export default action
