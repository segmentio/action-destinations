import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import HubspotClient from '../hubspot-client'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Contact',
  description: 'Create or update a contact in HubSpot.',
  defaultSubscription: 'type = "identify"',
  fields: {
    /* 
      Ideally the email field shouldn't be named email as it allows for any identify value to be provided. 
      The ability to provide Hubspot with any identifier type was added after this field was defined.
      It was decided that the email field would remain in place, rather than needing to run a DB migration  
    */
    email: {
      label: 'Identifier Value',
      type: 'string',
      description:
        "An Identifier for the Contact. This can be the Contact's email address or the value of any other unique Contact property. If an existing Contact is found, Segment will update the Contact. If a Contact is not found, Segment will create a new Contact.",
      required: true,
      default: {
        '@path': '$.traits.email'
      }
    },
    identifier_type: {
      label: 'Identifier Type',
      type: 'string',
      description:
        'The type of identifier used to uniquely identify the Contact. This defaults to email, but can be set to be any unique Contact property.',
      dynamic: true,
      required: false,
      default: 'email'
    },
    canonical_id: {
      label: 'Canonical Contact Identifier Value',
      type: 'string',
      description: 'Hidden field use to store the canonical identifier for the Contact during processing.',
      unsafe_hidden: true,
      required: false,
      default: undefined
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
    },
    enable_batching: {
      type: 'boolean',
      label: 'Send Batch Data to HubSpot',
      description:
        'If true, Segment will batch events before sending to HubSpot’s API endpoint. HubSpot accepts batches of up to 100 events. Note: Contacts created with batch endpoint can’t be associated to a Company from the UpsertCompany Action.',
      default: false
    }
  },
  perform: async (request, { payload, transactionContext }) => {
    const client = new HubspotClient(request) 
    return client.createOrUpdateSingleContact(payload, transactionContext)
  },

  performBatch: async (request, {payload: payloads}) => {
    const client = new HubspotClient(request) 
    await client.addCononicalIdToBatchPayloads(payloads)
    const { createList, updateList } =  client.buildBatchContactUpsertPayloads(payloads)
    await client.createOrUpdateBatchContacts(createList, updateList)
  }

}

export default action
