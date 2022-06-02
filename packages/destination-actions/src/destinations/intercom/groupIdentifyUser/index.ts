import { ActionDefinition, RequestClient, RetryableError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Group Identify User',
  description: 'Create or Update A Company',
  defaultSubscription: 'type = "group"',
  platform: 'web',
  fields: {
    remote_created_at: {
      type: 'datetime',
      description: 'The time the company was created by you.',
      label: 'Remote Created At',
      default: {
        '@path': '$.traits.createdAt'
      }
    },
    company_id: {
      type: 'string',
      description: "The unique identifier of the company. Can't be updated.",
      label: 'Company ID',
      required: true,
      default: {
        '@path': '$.groupId'
      }
    },
    user_id: {
      type: 'string',
      description: 'Attached user to the Company',
      label: 'User ID',
      default: {
        '@path': '$.userId'
      }
    },
    name: {
      type: 'string',
      description: 'The name of the company',
      label: 'Name',
      default: {
        '@path': '$.traits.name'
      }
    },
    monthly_spend: {
      type: 'number',
      description: 'The monthly spend of the company',
      label: 'Monthly Spend',
      default: {
        '@path': '$.traits.plan'
      }
    },
    plan: {
      type: 'string',
      description: 'The plan of the company',
      label: 'Plan',
      default: {
        '@path': '$.traits.plan'
      }
    },
    size: {
      type: 'number',
      description: 'The size of the company',
      label: 'Size',
      default: {
        '@path': '$.traits.employees'
      }
    },
    website: {
      type: 'string',
      description: 'The website of the company',
      label: 'Website',
      default: {
        '@path': '$.traits.website'
      }
    },
    industry: {
      type: 'string',
      description: 'The industry of the company',
      label: 'Industry',
      default: {
        '@path': '$.traits.industry'
      }
    },
    custom_attributes: {
      type: 'object',
      description: 'Passing any traits not mapped to individual fields as Custom Attributes',
      label: 'Custom Attributes',
      default: {
        '@path': '$.traits'
      }
    }
  },
  // https://developers.intercom.com/intercom-api-reference/reference/create-or-update-company
  // https://developers.intercom.com/intercom-api-reference/reference/attach-contact-to-company
  // Companies will be only visible in Intercom when there is at least one associated user.
  //
  // Create or Update Company.
  // Then attach user. If 404, throw a retryable error
  perform: async (request, { payload }) => {
    await createOrUpdateIntercomCompany(request, payload)
    try {
      return await attachUserToIntercomCompany(request, payload)
    } catch (error) {
      if (error?.response?.status === 404) {
        throw new RetryableError(`User doesn't exist, retry again`)
      }
      throw error
    }
  }
}

async function createOrUpdateIntercomCompany(request: RequestClient, payload: Payload) {
  return request(`https://api.intercom.io/companies`, {
    method: 'POST',
    json: payload
  })
}

async function attachUserToIntercomCompany(request: RequestClient, payload: Payload) {
  const { user_id, company_id } = payload

  return request(`https://api.intercom.io/contacts/${user_id}/companies`, {
    method: 'POST',
    json: {
      id: company_id
    }
  })
}

export default action
