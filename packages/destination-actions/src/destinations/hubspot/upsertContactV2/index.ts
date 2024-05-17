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
        first_name: {
          label: 'First Name',
          type: 'string',
          description: "the contact's first name."
        },
        last_name: {
          label: 'Last Name',
          type: 'string',
          description: "the contact's last name."
        },
        phone_number: {
          label: 'Phone Number',
          type: 'string',
          description: "the Contact's primary phone number. "
        },
        job_title: {
          label: 'Job Title',
          type: 'string',
          description: "the Contact's job title."
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
          description: "the Contact's country of residence."
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
        first_name: { '@path': '$.traits.first_name' },
        last_name: { '@path': '$.traits.last_name' },
        phone_number: { '@path': '$.traits.phone' },
        job_title: { '@path': '$.traits.title' },
        street_address: { '@path': '$.traits.address.street' },
        city: { '@path': '$.traits.address.city' },
        country: { '@path': '$.traits.address.country' },
        state_region: { '@path': '$.traits.state' },
        postal_code: { '@path': '$.traits.postal_code' },
        company: { '@path': '$.traits.company' },
        website_url: { '@path': '$.traits.website' }
      }
    }
  }
}

export default action
