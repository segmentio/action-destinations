import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { API_BASE } from '../api'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Group Company',
  description:
    'Create or update a company in GainTrace. Safe to call repeatedly: GainTrace upserts on the company ID rather than creating duplicates.',
  defaultSubscription: 'type = "group"',
  fields: {
    groupId: {
      label: 'Company ID',
      description: "The customer's own identifier for the company. GainTrace upserts on this value.",
      type: 'string',
      required: true,
      default: { '@path': '$.groupId' }
    },
    name: {
      label: 'Company Name',
      description: 'The display name of the company. Falls back to the Company ID when absent.',
      type: 'string',
      default: { '@path': '$.traits.name' }
    },
    domain: {
      label: 'Domain',
      description: 'The primary web domain of the company, for example "acme.com".',
      type: 'string',
      default: { '@path': '$.traits.website' }
    },
    industry: {
      label: 'Industry',
      description: 'The industry the company operates in.',
      type: 'string',
      default: { '@path': '$.traits.industry' }
    },
    employeeCount: {
      label: 'Employee Count',
      description: 'The number of employees at the company.',
      type: 'number',
      default: { '@path': '$.traits.employees' }
    },
    plan: {
      label: 'Plan',
      description: 'The plan or tier the company is on.',
      type: 'string',
      default: { '@path': '$.traits.plan' }
    }
  },
  perform: (request, { payload }) =>
    request(`${API_BASE}/companies`, {
      method: 'POST',
      json: {
        externalId: payload.groupId,
        name: payload.name || payload.groupId,
        ...(payload.domain ? { domain: payload.domain } : {}),
        ...(payload.industry ? { industry: payload.industry } : {}),
        ...(payload.employeeCount != null ? { employeeCount: payload.employeeCount } : {}),
        ...(payload.plan ? { plan: payload.plan } : {})
      }
    })
}

export default action
