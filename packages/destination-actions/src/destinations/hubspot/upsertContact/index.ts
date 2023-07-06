import { HTTPError } from '@segment/actions-core'
import { ActionDefinition, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { HUBSPOT_BASE_URL } from '../properties'
import { flattenObject } from '../utils'

interface ContactResponse {
  id: string
  properties: Record<string, string>
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Contact',
  description: 'Create or update a contact in HubSpot.',
  defaultSubscription: 'type = "identify"',
  fields: {
    email: {
      label: 'Email',
      type: 'string',
      description:
        'The contact’s email. Email is used to uniquely identify contact records in HubSpot. If an existing contact is found with this email, we will update the contact. If a contact is not found, we will create a new contact.',
      required: true,
      format: 'email',
      default: {
        '@path': '$.traits.email'
      }
    },
    company: {
      label: 'Company Name',
      type: 'string',
      description: 'The contact’s company.',
      default: {
        '@path': '$.traits.company'
      }
    },
    firstname: {
      label: 'First Name',
      type: 'string',
      description: 'The contact’s first name.',
      default: {
        '@if': {
          exists: { '@path': '$.traits.first_name' },
          then: { '@path': '$.traits.first_name' },
          else: { '@path': '$.traits.firstName' }
        }
      }
    },
    lastname: {
      label: 'Last Name',
      type: 'string',
      description: 'The contact’s last name.',
      default: {
        '@if': {
          exists: { '@path': '$.traits.last_name' },
          then: { '@path': '$.traits.last_name' },
          else: { '@path': '$.traits.lastName' }
        }
      }
    },
    phone: {
      label: 'Phone',
      type: 'string',
      description: 'The contact’s phone number.',
      default: {
        '@path': '$.traits.phone'
      }
    },
    address: {
      label: 'Street Address',
      type: 'string',
      description: "The contact's street address, including apartment or unit number.",
      default: {
        '@path': '$.traits.address.street'
      }
    },
    city: {
      label: 'City',
      type: 'string',
      description: "The contact's city of residence.",
      default: {
        '@path': '$.traits.address.city'
      }
    },
    state: {
      label: 'State',
      type: 'string',
      description: "The contact's state of residence.",
      default: {
        '@path': '$.traits.address.state'
      }
    },
    country: {
      label: 'Country',
      type: 'string',
      description: "The contact's country of residence.",
      default: {
        '@path': '$.traits.address.country'
      }
    },
    zip: {
      label: 'Postal Code',
      type: 'string',
      description: "The contact's zip code.",
      default: {
        '@if': {
          exists: { '@path': '$.traits.address.postalCode' },
          then: { '@path': '$.traits.address.postalCode' },
          else: { '@path': '$.traits.address.postal_code' }
        }
      }
    },
    website: {
      label: 'Website',
      type: 'string',
      description: 'The contact’s company/other website.',
      default: {
        '@path': '$.traits.website'
      }
    },
    lifecyclestage: {
      label: 'Lifecycle Stage',
      type: 'string',
      description:
        'The contact’s stage within the marketing/sales process. See more information on default and custom stages in [HubSpot’s documentation](https://knowledge.hubspot.com/contacts/use-lifecycle-stages). Segment supports moving status forwards or backwards.'
    },
    properties: {
      label: 'Other properties',
      type: 'object',
      description:
        'Any other default or custom contact properties. On the left-hand side, input the internal name of the property as seen in your HubSpot account. On the right-hand side, map the Segment field that contains the value. Custom properties must be predefined in HubSpot. See more information in [HubSpot’s documentation](https://knowledge.hubspot.com/crm-setup/manage-your-properties#create-custom-properties).',
      defaultObjectUI: 'keyvalue:only'
    }
  },
  perform: async (request, { payload, transactionContext }) => {
    const contactProperties = {
      company: payload.company,
      firstname: payload.firstname,
      lastname: payload.lastname,
      phone: payload.phone,
      address: payload.address,
      city: payload.city,
      state: payload.state,
      country: payload.country,
      zip: payload.zip,
      email: payload.email,
      website: payload.website,
      lifecyclestage: payload.lifecyclestage?.toLowerCase(),
      ...flattenObject(payload.properties)
    }

    /**
     * An attempt is made to update contact with given properties. If HubSpot returns 404 indicating
     * the contact is not found, an attempt will be made to create contact with the given properties
     */

    try {
      const response = await updateContact(request, payload.email, contactProperties)

      // cache contact_id for it to be available for company action
      transactionContext?.setTransaction('contact_id', response.data.id)

      // HubSpot returns the updated lifecylestage(LCS) as part of the response.
      // If the stage we are trying to set is backward than the current stage, it retains the current stage
      // and updates the timestamp. For determining if reset is required or not, we can compare
      // the stage returned in response with the desired stage . If they are not the same, reset
      // and update. More details - https://knowledge.hubspot.com/contacts/use-lifecycle-stages
      if (payload.lifecyclestage) {
        const currentLCS = response.data.properties['lifecyclestage']
        const hasLCSChanged = currentLCS === payload.lifecyclestage.toLowerCase()
        if (hasLCSChanged) return response
        // reset lifecycle stage
        await updateContact(request, payload.email, { lifecyclestage: '' })
        // update contact again with new lifecycle stage
        return updateContact(request, payload.email, contactProperties)
      }
      return response
    } catch (ex) {
      if ((ex as HTTPError)?.response?.status == 404) {
        const result = await createContact(request, contactProperties)

        // cache contact_id for it to be available for company action
        transactionContext?.setTransaction('contact_id', result.data.id)
        return result
      }
      throw ex
    }
  }
}

async function createContact(request: RequestClient, contactProperties: { [key: string]: unknown }) {
  return request<ContactResponse>(`${HUBSPOT_BASE_URL}/crm/v3/objects/contacts`, {
    method: 'POST',
    json: {
      properties: contactProperties
    }
  })
}

async function updateContact(request: RequestClient, email: string, properties: { [key: string]: unknown }) {
  return request<ContactResponse>(`${HUBSPOT_BASE_URL}/crm/v3/objects/contacts/${email}?idProperty=email`, {
    method: 'PATCH',
    json: {
      properties: properties
    }
  })
}

export default action
