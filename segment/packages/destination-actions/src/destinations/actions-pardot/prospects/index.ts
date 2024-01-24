import { ActionDefinition, IntegrationError, HTTPError } from '@segment/actions-core'
import type { ModifiedResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import Pardot from '../pa-operations'
import { customFields } from '../pa-properties'
import type { Payload } from './generated-types'

interface PardotError {
  code: number
  message: string
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Prospect',
  description: 'Create or update a prospect in Pardot using email address.',
  defaultSubscription: 'type = "identify"',
  fields: {
    email: {
      label: 'Email Address',
      description: `The prospect's email address.
        Used to upsert a prospect in Pardot. If multiple prospects have the given email, the prospect with the latest activity is updated. If there's no prospect with the given email, a prospect is created. Please note that Pardot treats email address as case sensitive and will create multiple prospects for casing differences.`,
      type: 'string',
      required: true,
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
      required: false,
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
      required: false,
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
      type: 'string',
      required: false
    },
    phone: {
      label: 'Phone Number',
      description: "The prospect's phone number.",
      type: 'string',
      required: false,
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
      required: false,
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
      required: false,
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
      type: 'string',
      required: false
    },
    city: {
      label: 'City',
      description: "The prospect's city.",
      type: 'string',
      required: false,
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
      required: false,
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
      required: false,
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
      required: false,
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
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.website' },
          then: { '@path': '$.traits.website' },
          else: { '@path': '$.properties.website' }
        }
      }
    },
    secondaryDeletedSearch: {
      label: 'Search Deleted Prospects',
      description: `If true, the request’s search includes deleted records. This property only affects [AMPSEA accounts](https://help.salesforce.com/s/articleView?id=sf.pardot_admin_ampsea_parent.htm&type=5).
      If all records with a matching email address are deleted, the one with the latest activity is undeleted and updated. Otherwise, a new prospect is created.`,
      type: 'boolean',
      required: true,
      default: true
    },
    customFields: customFields
  },
  perform: async (request, { settings, payload }) => {
    const baseUrl = settings.isSandbox ? 'https://pi.demo.pardot.com' : 'https://pi.pardot.com'
    const pa: Pardot = new Pardot(settings.businessUnitID, baseUrl, request)
    try {
      return await pa.upsertRecord(payload)
    } catch (err) {
      const error = err as HTTPError
      if (!error.response) {
        throw err
      }
      const statusCode = error.response.status
      //Pardot error response is a mix of json and xml.
      //Json error response handle the error in body payload.
      if (error.response.headers.get('content-type')?.includes('application/json')) {
        const data = (error.response as ModifiedResponse).data as PardotError
        throw new IntegrationError(
          `Pardot responded witha error code ${data.code}: ${data.message}. This means Pardot has received the call, but consider the payload to be invalid.  To identify the exact error, please refer to ` +
            `https://developer.salesforce.com/docs/marketing/pardot/guide/error-codes.html?q=error#numerical-list-of-error-codes and search for the error code you received.`,
          'PARDOT_ERROR',
          400
        )
      }
      //XML error response handles the error in headers.
      //https://developer.salesforce.com/docs/marketing/pardot/guide/error-codes.html?q=error#numerical-list-of-error-codes
      else if (error.response.headers.get('content-type')?.includes('text/xml')) {
        if (statusCode === 403 || statusCode === 400) {
          throw new IntegrationError(
            `The Business Unit ID or access_token is invalid. This error is also returned when you use the wrong instance (Sandbox or Prod). ` +
              `If you toggled the Sandbox instance, please disconnect and reconnect with your corresponding username.`,
            'PARDOT_ERROR',
            403
          )
        }
      }
      throw err
    }
  }
}

export default action
