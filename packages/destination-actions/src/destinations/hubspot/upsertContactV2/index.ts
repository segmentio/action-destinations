import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import objectAction from '../upsertObject/index'

const action: ActionDefinition<Settings, Payload> = {
  ...objectAction,
  title: 'Upsert Contact V2',
  description: 'Upsert a Contact Object to HubSpot and optionally assocate it with another record of any Object type.',
  defaultSubscription: 'type = "identify"',
  fields: {
    ...objectAction.fields,
    createObject: {
      ...objectAction.fields.createObject,
      default: false,
      unsafe_hidden: true
    },
    createProperties: {
      ...objectAction.fields.createProperties,
      description: "Specify if Segment should create new Properties on the Contacts Object automatically on HubSpot if they do not already exist."
    },
    createIdentifier: {
      ...objectAction.fields.createIdentifier,
      description: "Specify if Segment should create a new Identifier 'Unique Field' on the Contacts Object automatically on HubSpot if it does not already exist."
    },
    objectType: {
      ...objectAction.fields.objectType,
      default: 'contacts',
      unsafe_hidden: true
    },
    insertType: {
      ...objectAction.fields.insertType,
      description: 'Specify if Segment should create, update or upsert a Contact Record.',
    },
    idFieldName: {
      ...objectAction.fields.idFieldName,
      label: 'Contact ID Field Name',
      description: "The name of the unique field Segment will use as an identifier when creating, updating or upserting a Contact Record.",
    }, 
    associationLabel: {
      ...objectAction.fields.associationLabel,
      description: 'The type of Association between the Contact record and another Record. The Association must already exist in Hubspot.',
    },
    idFieldValue: {
      ...objectAction.fields.idFieldValue,
      label: 'Contact ID Field Value',
      description: "The value of the Contact identifier to send to Hubspot.",
    },
    stringProperties: {
      ...objectAction.fields.stringProperties,
      description: "The Contact's String Properties to send to HubSpot.",
      properties: {
        lifecyclestage: {
          label: 'Lifecycle Stage',
          type: 'string',
          description: "The lifecycle stage the Contact is in."
        },
        firstname: {
          label: 'First Name',
          type: 'string',
          description: "the contact's first name."
        },
        lastname: {
          label: 'Last Name',
          type: 'string',
          description: "the contact's last name."
        },
        phone: {
          label: 'Phone Number',
          type: 'string',
          description: "The Contact's primary phone number."
        },
        mobilephone: {
          label: 'Mobile Phone Number',
          type: 'string',
          description: "The A contact's mobile phone number."
        },
        jobtitle: {
          label: 'Job Title',
          type: 'string',
          description: "the Contact's job title."
        },
        industry: {
          label: 'Industry',
          type: 'string',
          description: "The Industry a Contact is in."
        },
        street_address: {
          label: 'Street Address',
          type: 'string',
          description: "the contact's street address, including apartment or unit #."
        },
        city: {
          label: 'City',
          type: 'string',
          description: "The Contact's city of residence."
        },
        country: {
          label: 'Country / Region',
          type: 'string',
          description: "The contact's country/region of residence."
        },
        state_region: {
          label: 'State / Region',
          type: 'string',
          description: "the Contact's state of residence"
        },
        postal_code: {
          label: 'Postal Code',
          type: 'string',
          description: "the Contact's postal code."
        },
        company: {
          label: 'Company Name',
          type: 'string',
          description: "the name of the Contact's company."
        },
        website_url: {
          label: 'Website URL',
          type: 'string',
          format: 'uri',
          description: "the contact's company website."
        }
      },
      default: {
        lifecyclestage: { '@path': '$.traits.lifecycle_stage' },
        firstname: { '@path': '$.traits.first_name' },
        lastname: { '@path': '$.traits.last_name' },
        phone: { '@path': '$.traits.phone' },
        mobilephone: { '@path': '$.traits.mobile_phone' },
        jobtitle: { '@path': '$.traits.title' },
        industry: { '@path': '$.traits.industry'},
        street_address: { '@path': '$.traits.address.street' },
        city: { '@path': '$.traits.address.city' },
        country: { '@path': '$.traits.address.country' },
        state_region: { '@path': '$.traits.state' },
        postal_code: { '@path': '$.traits.postal_code' },
        company: { '@path': '$.traits.company' },
        website_url: { '@path': '$.traits.website' }
      }
    },
    numericProperties: {
      ...objectAction.fields.numericProperties,
      description: "The Contact's numberic Properties to send to HubSpot.",
      properties: {
        annualrevenue: {
          label: 'Annual Revenue',
          type: 'number',
          description: "Annual company revenue."
        }
      },
      default: {
        annualrevenue: { '@path': '$.traits.annual_revenue' },
       
      }
    },
  }
}

export default action
