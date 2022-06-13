import { ActionDefinition, ModifiedResponse, RequestClient, RetryableError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

interface IntercomCreateCompanyData {
  id: string
}

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
      description:
        'Attach this user to the company. This userId is NOT the external_id or email; it is the Intercom unique identifier',
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
      description:
        'Passing any traits not mapped to individual fields as Custom Attributes. Note: Will throw an error if you pass an attribute that isn`t explicitly defined',
      label: 'Custom Attributes'
    }
  },
  // https://developers.intercom.com/intercom-api-reference/reference/create-or-update-company
  // https://developers.intercom.com/intercom-api-reference/reference/attach-contact-to-company
  // Companies will be only visible in Intercom when there is at least one associated user.
  //
  // Create or Update Company, then attach user. If user is not found (404), throw a retryable error
  // as the user might be created soon
  perform: async (request, { payload }) => {
    const userId = payload.user_id
    delete payload.user_id

    const response = await createOrUpdateIntercomCompany(request, payload)
    if (userId) {
      try {
        const companyId = response.data.id
        return await attachUserToIntercomCompany(request, userId, companyId)
      } catch (error) {
        // Should be an HTTPError, but was failing instanceOf (?)
        if (error?.response?.status === 404) {
          throw new RetryableError(`User doesn't exist, retrying`)
        }
        throw error
      }
    }
  }
}

function createOrUpdateIntercomCompany(
  request: RequestClient,
  payload: Payload
): Promise<ModifiedResponse<IntercomCreateCompanyData>> {
  return request(`https://api.intercom.io/companies`, {
    method: 'POST',
    json: payload
  })
}

function attachUserToIntercomCompany(request: RequestClient, userId: string, companyId: string) {
  return request(`https://api.intercom.io/contacts/${userId}/companies`, {
    method: 'POST',
    json: {
      id: companyId
    }
  })
}

export default action
