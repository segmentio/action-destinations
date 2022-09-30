import type { ActionDefinition, RequestClient } from '@segment/actions-core'
import { HTTPError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { HubSpotBaseURL } from '../properties'
import type { Payload } from './generated-types'

interface ContactResponse {
  properties: Record<string, string>
}

interface PropertiesResponse {
  results: Property[]
}

interface Property {
  name: string
  label: string
  options: PropertyOption[]
}

interface PropertyOption {
  label: string
  value: string
  displayOrder: number
  hidden: boolean
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
        'Any other default or custom contact properties. Custom properties must be predefined in HubSpot. See more information in [HubSpot’s documentation](https://knowledge.hubspot.com/crm-setup/manage-your-properties#create-custom-properties).',
      defaultObjectUI: 'keyvalue:only'
    }
  },
  perform: async (request, { payload }) => {
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
      lifecyclestage: payload.lifecyclestage,
      ...payload.properties
    }

    try {
      const response = await updateContact(request, payload.email, contactProperties)
      if (payload.lifecyclestage && response.data.properties) {
        const currentLCS = response.data.properties['lifecyclestage']
        const isValid = await isLCSStageValid(request, payload.lifecyclestage, currentLCS)
        if (isValid) return response
        // reset lifecycle stage
        await updateContact(request, payload.email, { lifecylestage: '' })
        // update contact again with new lifecycle stage
        return updateContact(request, payload.email, contactProperties)
      }
      return response
    } catch (ex) {
      const error = ex as HTTPError
      const statusCode = error.response.status
      if (statusCode == 404) {
        return createContact(request, { email: payload.email, ...contactProperties })
      }
      throw error
    }
  }
}

async function createContact(request: RequestClient, contactProperties: { [key: string]: unknown }) {
  return request(`${HubSpotBaseURL}/crm/v3/objects/contacts`, {
    method: 'POST',
    json: {
      properties: {
        ...contactProperties
      }
    }
  })
}

async function isLCSStageValid(request: RequestClient, newLCS: string, currentLCS: string) {
  if (newLCS == currentLCS) return true

  const response = await request<PropertiesResponse>(`${HubSpotBaseURL}/crm/v3/properties/contacts`, {
    method: 'GET'
  })

  const lifecycleStage = response.data.results.find((property) => property.name == 'lifecyclestage')
  if (!lifecycleStage) {
    return
  }

  const stageOrderMap = Object.fromEntries(
    lifecycleStage.options.map(({ value, displayOrder }) => [value, displayOrder])
  )

  const newLCSOrder = stageOrderMap[newLCS]
  const existingLCSOrder = stageOrderMap[currentLCS]

  if (!newLCS) return true

  return newLCSOrder >= existingLCSOrder
}

async function updateContact(request: RequestClient, email: string, properties: { [key: string]: unknown }) {
  return await request<ContactResponse>(`${HubSpotBaseURL}/crm/v3/objects/contacts/${email}?idProperty=email`, {
    method: 'PATCH',
    json: {
      properties: {
        ...properties
      }
    }
  })
}

export default action
