import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Company',
  description: 'Create or update a company in HubSpot.',
  defaultSubscription: 'type == "group"',
  fields: {
    name: {
      label: 'Name',
      description: 'The company’s name.',
      required: true,
      type: 'string'
    },
    city: {
      label: 'City',
      description: 'City for the company’s address.',
      type: 'string'
    },
    state: {
      label: 'State',
      description: 'State for the company’s address.',
      type: 'string'
    },
    domain: {
      label: 'Domain/Website',
      description: 'Company’s domain name URL.',
      type: 'string',
      format: 'uri'
    },
    phone: {
      label: 'Phone',
      description: 'Phone number for the company',
      type: 'string'
    },
    industry: {
      label: 'Industry',
      description: 'Industry to which the company belong from',
      type: 'string'
    },
    otherFields: {
      label: 'Other Fields',
      description:
        'Any other default or custom company properties. Custom properties must be predefined in HubSpot. More information in HubSpot documentation.',
      type: 'object',
      defaultObjectUI: 'keyvalue:only'
    }
  },
  perform: (_request) => {
    // Make your partner api request here!
    // return request('https://example.com', {
    //   method: 'post',
    //   json: data.payload
    // })
  }
}

export default action
