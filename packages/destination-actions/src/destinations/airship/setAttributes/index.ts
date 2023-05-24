import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { setAttribute } from '../utilities'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Set Attributes',
  defaultSubscription: 'type = "identify"',
  description:
    'Set user attributes in Airship with data from Segment. Some common user attributes are predefined in the attributes field, however note that all must be created in Airship before use. More information here: https://docs.airship.com/guides/messaging/user-guide/audience/segmentation/attributes/project/#adding-attributes',
  fields: {
    named_user_id: {
      label: 'Airship Named User ID',
      description: 'The identifier assigned in Airship as the Named User',
      type: 'string',
      required: true,
      default: {
        '@path': '$.userId'
      }
    },
    occurred: {
      label: 'Occurred',
      description: 'When the Trait was set',
      type: 'datetime',
      required: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    attributes: {
      label: 'Attributes',
      description:
        'User Attributes. Attributes should exist in Airship in order to be set, including the predifined ones defaulted here.',
      type: 'object',
      additionalProperties: true,
      defaultObjectUI: 'keyvalue',
      properties: {
        title: {
          label: 'Title',
          type: 'string',
          description: 'Title (Mr, Mrs, Professor, ...'
        },
        first_name: {
          label: 'First Name',
          type: 'string',
          description: "The user's first name."
        },
        last_name: {
          label: 'Last Name',
          type: 'string',
          description: "The user's last name."
        },
        full_name: {
          label: 'Full Name',
          type: 'string',
          description: "The user's full name."
        },
        gender: {
          label: 'Gender',
          type: 'string',
          description: "The user's gender."
        },
        zipcode: {
          label: 'Zipcode',
          type: 'integer',
          description: "The user's zipcode."
        },
        city: {
          label: 'City',
          type: 'string',
          description: "The user's city."
        },
        region: {
          label: 'Region',
          type: 'string',
          description: "The user's region."
        },
        country: {
          label: 'Country',
          type: 'string',
          description: "The user's country."
        },
        birthdate: {
          label: 'Birthdate',
          type: 'datetime',
          description: "The user's birthdate."
        },
        age: {
          label: 'Age',
          type: 'integer',
          description: "The user's age in years."
        },
        mobile_phone: {
          label: 'Mobile Phone Number',
          type: 'integer',
          description: "The user's mobile phone number."
        },
        home_phone: {
          label: 'Home Phone Number',
          type: 'integer',
          description: "The user's home phone number."
        },
        work_phone: {
          label: 'Work Phone Number',
          type: 'integer',
          description: "The user's work phone number."
        },
        loyalty_tier: {
          label: 'Loyalty Tier',
          type: 'string',
          description: "The user's loyalty tier."
        },
        company: {
          label: 'Company Name',
          type: 'string',
          description: "The user's company name."
        },
        username: {
          label: 'Username',
          type: 'string',
          description: "The user's username."
        },
        account_creation: {
          label: 'Account Creation Date',
          type: 'datetime',
          description: "The user's account creation date."
        },
        email: {
          label: 'Email Address',
          type: 'string',
          description: "The user's email address."
        },
        altitude: {
          label: 'Altitude',
          type: 'integer',
          description: "The user's altitude."
        },
        latitude: {
          label: 'Latitude',
          type: 'number',
          description: "The user's latitude."
        },
        longitude: {
          label: 'Longitude',
          type: 'number',
          description: "The user's longitude."
        },
        advertising_id: {
          label: 'Advertising ID (IDFA/AAID)',
          type: 'string',
          description: "The user's advertising ID."
        }
      },
      default: {
        title: { '@path': '$.traits.title' },
        first_name: { '@path': '$.traits.first_name' },
        last_name: { '@path': '$.traits.last_name' },
        full_name: { '@path': '$.traits.full_name' },
        gender: { '@path': '$.traits.gender' },
        zipcode: { '@path': '$.traits.address.postalCode' },
        city: { '@path': '$.traits.address.city' },
        region: { '@path': '$.traits.region' },
        country: { '@path': '$.traits.address.country' },
        birthdate: { '@path': '$.traits.birthdate' },
        age: { '@path': '$.traits.age' },
        mobile_phone: { '@path': '$.traits.phone' },
        home_phone: { '@path': '$.traits.home_phone' },
        work_phone: { '@path': '$.traits.work_phone' },
        loyalty_tier: { '@path': '$.traits.loyalty_tier' },
        company: { '@path': '$.traits.company_name' },
        username: { '@path': '$.traits.username' },
        account_creation: { '@path': '$.traits.account_creation' },
        email: { '@path': '$.traits.email' },
        altitude: { '@path': '$.traits.altitude' },
        latitude: { '@path': '$.traits.latitude' },
        longitude: { '@path': '$.traits.longitude' },
        advertising_id: { '@path': '$.context.device.advertisingId' }
      }
    }
  },
  perform: (request, { settings, payload }) => {
    return setAttribute(request, settings, payload)
  }
}

export default action
