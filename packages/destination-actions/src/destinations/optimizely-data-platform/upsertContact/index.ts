import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Contact',
  description: '',
  fields: {
    email: {
      label: 'Email',
      type: 'string',
      description: 'Identifier email address',
      required: true,
      format: 'email',
      default: {
        '@path': '$.traits.email'
      }
    },
    company: {
      label: 'Company',
      type: 'string',
      description: 'Company Name',
      default: {
        '@path': '$.traits.company'
      }
    },
    title: {
      label: 'Title',
      type: 'string',
      description: 'Person title',
      default: {
        '@path': '$.traits.title'
      }
    },
    name: {
      label: 'Name',
      type: 'string',
      description: 'Person Full Name',
      default: {
        '@path': '$.traits.name'
      }
    },
    firstname: {
      label: 'First Name',
      type: 'string',
      description: 'First name',
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
      description: 'Last name.',
      default: {
        '@if': {
          exists: { '@path': '$.traits.last_name' },
          then: { '@path': '$.traits.last_name' },
          else: { '@path': '$.traits.lastName' }
        }
      }
    },
    gender: {
      label: 'Gender',
      type: 'string',
      description: 'Person Gender',
      default: {
        '@path': '$.traits.gender'
      }
    },
    DOB: {
      label: 'Birthday',
      type: 'string',
      description: 'Birthday',
      default: {
        '@path': '$.traits.birthday'
      }
    },
    phone: {
      label: 'Phone',
      type: 'string',
      description: 'Phone number.',
      default: {
        '@path': '$.traits.phone'
      }
    },
    address: {
      label: 'Address',
      type: 'object',
      description: "Address details object",
      default: {
        '@path': '$.traits.address'
      }
    },
    imageURL: {
      label: 'avatar',
      type: 'string',
      description: 'user image',
      default: {
        '@path': '$.traits.avatar'
      }
    },
    properties: {
      label: 'Other properties',
      type: 'object',
      description: 'Properties',
      defaultObjectUI: 'keyvalue:only'
    }
  },
  perform: (request, { payload }) => {
    
    const body = {
      type: 'product',
      image_url: payload.imageURL
    }

    return request('https://example.com', {
      method: 'post',
      json: body
    })
  }
}

export default action
