import { ActionDefinition, ModifiedResponse, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { getUniqueIntercomContact } from '../util'
import type { Payload } from './generated-types'

interface IntercomCreateCompanyData {
  id: string
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify Company',
  description: 'Create or update a company in Intercom and attach a contact.',
  defaultSubscription: 'type = "group"',
  fields: {
    remote_created_at: {
      type: 'datetime',
      description: 'The time the company was created by you.',
      label: 'Company Creation Time',
      default: {
        '@path': '$.traits.createdAt'
      }
    },
    external_id: {
      type: 'string',
      description:
        'A unique identifier for the contact generated outside Intercom. External ID is required to attach a contact to a company if no email or Contact ID is provided.',
      label: 'External ID',
      default: {
        '@path': '$.userId'
      }
    },
    email: {
      type: 'string',
      description:
        "The contact's email address. Email is required to attach a contact to a company if no External ID or Contact ID is provided.",
      label: 'Email Address',
      format: 'email',
      default: {
        '@path': '$.traits.email'
      }
    },
    company_id: {
      type: 'string',
      description: "The unique identifier of the company. Once set, this can't be updated.",
      label: 'Company ID',
      required: true,
      default: {
        '@path': '$.groupId'
      }
    },
    contact_id: {
      type: 'string',
      description:
        'The unique identifier for the contact which is given by Intercom. If no Contact ID is provided, Segment will use External ID or email to find a contact to attach to the company.',
      label: 'Contact ID'
    },
    name: {
      type: 'string',
      description: 'The name of the company.',
      label: 'Company Name',
      default: {
        '@path': '$.traits.name'
      }
    },
    monthly_spend: {
      type: 'number',
      description: 'The monthly spend of the company, e.g. how much revenue the company generates for your business.',
      label: 'Monthly Spend',
      default: {
        '@path': '$.traits.monthly_spend'
      }
    },
    plan: {
      type: 'string',
      description: 'The name of the plan you have associated with the company.',
      label: 'Company Plan',
      default: {
        '@path': '$.traits.plan'
      }
    },
    size: {
      type: 'number',
      description: 'The number of employees in the company.',
      label: 'Company Size',
      default: {
        '@path': '$.traits.employees'
      }
    },
    website: {
      type: 'string',
      description: "The URL for the company's website",
      label: 'Company Website',
      default: {
        '@path': '$.traits.website'
      }
    },
    industry: {
      type: 'string',
      description: 'The industry that the company operates in.',
      label: 'Industry',
      default: {
        '@path': '$.traits.industry'
      }
    },
    custom_attributes: {
      type: 'object',
      description:
        'A hash of key-value pairs containing any other data about the company you want Intercom to store. You can only write to custom attributes that already exist in your Intercom workspace. Please ensure custom attributes are created in Intercom first. See [Intercom documentation](https://developers.intercom.com/intercom-api-reference/reference/create-data-attributes) for more information on creating attributes.',
      label: 'Custom Attributes',
      defaultObjectUI: 'keyvalue'
    }
  },
  /**
   * Create or Update Company, then attach contact.
   * We search for a unique contact by either their User ID or email.
   *
   * Note: Companies will be only visible in Intercom's Dashboard when there is at least one associated contact.
   */
  perform: async (request, { payload }) => {
    const contact = await getUniqueIntercomContact(request, payload)
    delete payload.email
    delete payload.external_id

    const response = await createOrUpdateIntercomCompany(request, payload)
    if (contact) {
      payload.contact_id = contact.id
      const companyId = response.data.id
      return attachContactToIntercomCompany(request, contact.id, companyId)
    }
    return response
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
