import { ActionDefinition, ModifiedResponse, RequestClient, RetryableError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

interface IntercomCreateCompanyData {
  id: string
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Group Identify Contact',
  description:
    "Create or Update A Company. Note: Companies will be only visible in Intercom's Dashboard when there is at least one associated contact.",
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
    contact_id: {
      type: 'string',
      description:
        'Attach this contact to the company. This ID is NOT the external_id or email; it is the Intercom unique identifier.',
      label: 'Contact ID',
      default: {
        '@path': '$.userId'
      }
    },
    name: {
      type: 'string',
      description: 'The name of the company.',
      label: 'Name',
      default: {
        '@path': '$.traits.name'
      }
    },
    monthly_spend: {
      type: 'number',
      description: 'The monthly spend of the company.',
      label: 'Monthly Spend',
      default: {
        '@path': '$.traits.plan'
      }
    },
    plan: {
      type: 'string',
      description: 'The plan of the company.',
      label: 'Plan',
      default: {
        '@path': '$.traits.plan'
      }
    },
    size: {
      type: 'number',
      description: 'The size of the company.',
      label: 'Size',
      default: {
        '@path': '$.traits.employees'
      }
    },
    website: {
      type: 'string',
      description: 'The website of the company.',
      label: 'Website',
      default: {
        '@path': '$.traits.website'
      }
    },
    industry: {
      type: 'string',
      description: 'The industry of the company.',
      label: 'Industry',
      default: {
        '@path': '$.traits.industry'
      }
    },
    custom_attributes: {
      type: 'object',
      description:
        'Passing any traits not mapped to individual fields as Custom Attributes. Note: Will throw an error if you pass an attribute that isn`t explicitly defined.',
      label: 'Custom Attributes'
    }
  },
  /**
   * Create or Update Company, then attach contact. If contact is not found (404), throw a retryable error
   * as the contact might be created soon
   *
   * Note: Companies will be only visible in Intercom's Dashboard when there is at least one associated contact.
   */
  perform: async (request, { payload }) => {
    const contactId = payload.contact_id
    delete payload.contact_id

    const response = await createOrUpdateIntercomCompany(request, payload)
    if (contactId) {
      try {
        const companyId = response.data.id
        return await attachContactToIntercomCompany(request, contactId, companyId)
      } catch (error) {
        // Should be an HTTPError, but was failing instanceOf (?)
        if (error?.response?.status === 404) {
          throw new RetryableError(`Contact doesn't exist, retrying`)
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

function attachContactToIntercomCompany(request: RequestClient, contactId: string, companyId: string) {
  return request(`https://api.intercom.io/contacts/${contactId}/companies`, {
    method: 'POST',
    json: {
      id: companyId
    }
  })
}

export default action
