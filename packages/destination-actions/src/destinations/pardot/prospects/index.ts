import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import Pardot from '../pa-operations'
import { customFields, operation, validateLookup } from '../pa-properties'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Prospect',
  description: 'Represents an opportunity, which is a sale or pending deal.',
  fields: {
    operation: operation,
    email: {
      label: 'Email Address',
      description:
        "The prospect's email address. **This is required to upsert prospect. If multiple prospects have the given email, the prospect with the latest activity is updated. If there's no prospect with the given email, a prospect is created.**",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      }
    },
    firstName: {
      label: 'First Name',
      description: "The prospect's first name.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.first_name' },
          then: { '@path': '$.traits.first_name' },
          else: { '@path': '$.properties.first_name' }
        }
      }
    },
    lastName: {
      label: 'Last Name',
      description: "The prospect's last name.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.last_name' },
          then: { '@path': '$.traits.last_name' },
          else: { '@path': '$.properties.last_name' }
        }
      }
    },
    salutation: {
      label: 'Salutation',
      description: "The prospect's formal prefix.",
      type: 'string'
    },
    phone: {
      label: 'Phone Number',
      description: "The prospect's phone number.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.phone' },
          then: { '@path': '$.traits.phone' },
          else: { '@path': '$.properties.phone' }
        }
      }
    },
    company: {
      label: 'Company',
      description: "The prospect's company.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.company' },
          then: { '@path': '$.traits.company' },
          else: { '@path': '$.properties.company' }
        }
      }
    },
    jobTitle: {
      label: 'Job Title',
      description: "The prospect's job title.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.title' },
          then: { '@path': '$.traits.title' },
          else: { '@path': '$.properties.title' }
        }
      }
    },
    industry: {
      label: 'Industry',
      description: "The prospect's industry.",
      type: 'string'
    },
    city: {
      label: 'City',
      description: "The prospect's city.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.address.city' },
          then: { '@path': '$.traits.address.city' },
          else: { '@path': '$.properties.address.city' }
        }
      }
    },
    state: {
      label: 'State',
      description: "The prospect's US state.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.address.state' },
          then: { '@path': '$.traits.address.state' },
          else: { '@path': '$.properties.address.state' }
        }
      }
    },
    zip: {
      label: 'Zip Code',
      description: "The prospect's postal code.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.address.postal_code' },
          then: { '@path': '$.traits.address.postal_code' },
          else: { '@path': '$.properties.address.postal_code' }
        }
      }
    },
    country: {
      label: 'Country',
      description: "The prospect's country.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.address.country' },
          then: { '@path': '$.traits.address.country' },
          else: { '@path': '$.properties.address.country' }
        }
      }
    },
    website: {
      label: 'Website',
      description: "The prospect's website URL.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.website' },
          then: { '@path': '$.traits.website' },
          else: { '@path': '$.properties.website' }
        }
      }
    },
    customFields: customFields
  },
  perform: async (request, { settings, payload }) => {
    const baseUrl = settings.isSandbox ? 'https://pi.demo.pardot.com' : 'https://pi.pardot.com'
    const pa: Pardot = new Pardot(settings.businessUnitID, baseUrl, request)

    validateLookup(payload)

    if (payload.operation === 'upsert') {
      //TODO
      pa
    }
  }
}

export default action
