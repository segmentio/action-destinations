import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { user_identifiers } from '../fields'
import { hosts } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Contact',
  description: 'Creates or updates a Contact in Optimizely Data Platform',
  defaultSubscription: 'type = "identify"',
  fields: {
    user_identifiers: user_identifiers,
    company: {
      label: 'Company Name',
      type: 'string',
      description: 'The name of the company associated with the Contact',
      default: { '@path': '$.traits.company' }
    },
    title: {
      label: 'Title',
      type: 'string',
      description: 'The Contact\'s Title',
      default: { '@path': '$.traits.title' }
    },
    name: {
      label: 'Name',
      type: 'string',
      description: 'Contact\'s full name',
      default: { '@path': '$.traits.name' }
    },
    firstname: {
      label: 'First Name',
      type: 'string',
      description: 'Contact\'s first name',
      default: { '@path': '$.traits.first_name' }
    },
    lastname: {
      label: 'Last Name',
      type: 'string',
      description: 'Contact\'s last name',
      default: { '@path': '$.traits.last_name' }
    },
    gender: {
      label: 'Gender',
      type: 'string',
      description: 'Contact\'s gender',
      default: { '@path': '$.traits.gender' }
    },
    DOB: {
      label: 'Birthday',
      type: 'datetime',
      description: 'Contact\'s birthday. The format should be datetime',
      default: { '@path': '$.traits.birthday' }
    },
    phone: {
      label: 'Phone',
      type: 'string',
      description: 'Contact\'s phone number.',
      default: { '@path': '$.traits.phone' }
    },
    age: {
      label: 'Age',
      type: 'number',
      description: 'Contact\'s age.',
      default: { '@path': '$.traits.age' }
    },
    address: {
      label: 'Address',
      type: 'object',
      description: "Address details object",
      properties: {
        street: {
          label: 'Street',
          type: 'string',
          description: "The user's street."
        },
        city: {
          label: 'City',
          type: 'string',
          description: "The user's city."
        },
        state: {
          label: 'State',
          type: 'string',
          description: "The user's state or region."
        },
        zip: {
          label: 'Zip code',
          type: 'string',
          description: "Zip or postal code"
        },
        country: {
          label: 'Country',
          type: 'string',
          description: "The user's country."
        }
      },
      default: {
        street: { '@path': '$.traits.address.street' },
        city: { '@path': '$.traits.address.city' },
        state: { '@path': '$.traits.address.state' },
        zip: { '@path': '$.traits.address.postalCode' },
        country: { '@path': '$.traits.address.country' },
      }
    },
    avatar: {
      label: 'avatar',
      type: 'string',
      description: "The user's avatar image URL.",
      default: { '@path': '$.traits.avatar' }
    }
  },
  perform: (request, { payload, settings }) => {
    const host = hosts[settings.region]

    const body = {
      user_identifiers: payload.user_identifiers,
      title: payload.title,
      name: payload.name,
      first_name: payload.firstname,
      last_name: payload.lastname,
      age: payload.age,
      dob: payload.DOB,
      gender: payload.gender,
      phone: payload.phone,
      address: payload.address,
      company: payload.company,
      image_url: payload.avatar
    }

    return request(`${host}/upsert_contact`, {
      method: 'post',
      json: body
    })
  }
}

export default action
