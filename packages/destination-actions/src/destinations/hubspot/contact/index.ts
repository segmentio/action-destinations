import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Contact',
  description: 'Create or update a contact in HubSpot.',
  defaultSubscription: 'type == "identify"',
  fields: {
    email: {
      label: 'Email',
      description: 'The contact’s email.',
      type: 'string',
      required: true,
      format: 'email'
    },
    company: {
      label: 'Company',
      description: 'The contact’s company.',
      type: 'string'
    },
    firstname: {
      label: 'First Name',
      description: 'The contact’s first name.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.first_name' },
          then: { '@path': '$.traits.first_name' },
          else: { '@path': '$.properties.first_name' }
        }
      }
    },
    lastname: {
      label: 'Last Name',
      description: 'The contact’s last name.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.last_name' },
          then: { '@path': '$.traits.last_name' },
          else: { '@path': '$.properties.last_name' }
        }
      }
    },
    phone: {
      label: 'Phone',
      description: 'The contact’s phone number.',
      type: 'string'
    },
    website: {
      label: 'Company',
      description: 'The contact’s company/other website.',
      type: 'string'
    },
    otherFields: {
      label: 'Other Fields',
      description:
        'Any other default or custom contact properties. Custom properties must be predefined in HubSpot. More information in HubSpot documentation.',
      type: 'object',
      defaultObjectUI: 'keyvalue:only'
    }
  },
  perform: (_request, _) => {
    // Make your partner api request here!
    // return request('https://example.com', {
    //   method: 'post',
    //   json: data.payload
    // })
  }
}

export default action
