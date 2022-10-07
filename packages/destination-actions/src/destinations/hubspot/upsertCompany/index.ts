import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Company',
  description: 'Create or update a company in HubSpot.',
  fields: {
    groupid: {
      label: 'Group ID',
      description: 'Used for constructing the unique segment_group_id for HubSpot.',
      type: 'hidden',
      default: {
        '@if': {
          exists: { '@path': '$.groupId' },
          then: { '@path': '$.groupId' },
          else: { '@path': '$.context.groupId' }
        }
      }
    },
    companysearchfields: {
      label: 'Company Search Fields',
      description:
        'The unique field(s) used to search for an existing company in HubSpot to update. By default, Segment creates a custom property to store groupId for each company and uses this property to search for companies. If a company is not found, the fields provided here are then used to search. If a company is still not found, a new one is created.',
      type: 'object',
      required: true,
      defaultObjectUI: 'keyvalue:only'
    },
    name: {
      label: 'Company Name',
      description: 'The name of the company.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.traits.name'
      }
    },
    description: {
      label: 'Company Description',
      description: 'A short statement about the company’s mission and goals.',
      type: 'string',
      default: {
        '@path': '$.traits.description'
      }
    },
    createdate: {
      label: 'Company Create Date',
      description: 'The date the company was added to your account.',
      type: 'string',
      default: {
        '@path': '$.traits.cteatedAt'
      }
    },
    streetaddress: {
      label: 'Street Address',
      description: 'The street address of the company.',
      type: 'string',
      default: {
        '@path': '$.traits.address.street'
      }
    },
    city: {
      label: 'City',
      description: 'The city where the company is located.',
      type: 'string',
      default: {
        '@path': '$.traits.address.city'
      }
    },
    state: {
      label: 'State',
      description: 'The state or region where the company is located.',
      type: 'string',
      default: {
        '@path': '$.traits.address.state'
      }
    },
    postalcode: {
      label: 'Postal Code',
      description: 'The postal or zip code of the company.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.address.postalCode' },
          then: { '@path': '$.traits.address.postalCode' },
          else: { '@path': '$.traits.address.postal_code' }
        }
      }
    },
    domain: {
      label: 'Domain',
      description: 'The company’s website domain.',
      type: 'string',
      default: {
        '@path': '$.traits.website'
      }
    },
    phone: {
      label: 'Phone',
      description: 'The company’s primary phone number.',
      type: 'string',
      default: {
        '@path': '$.traits.phone'
      }
    },
    numberofemployees: {
      label: 'Number of Employees',
      description: 'The total number of people who work for the company.',
      type: 'integer',
      default: {
        '@path': '$.traits.employees'
      }
    },
    industry: {
      label: 'Industry',
      description: 'The type of business the company performs.',
      type: 'string',
      default: {
        '@path': '$.traits.industry'
      }
    },
    lifecyclestage: {
      label: 'Lifecycle Stage',
      description:
        'The company’s stage within the marketing/sales process. See more information on default and custom stages in [HubSpot’s documentation](https://knowledge.hubspot.com/contacts/use-lifecycle-stages). Segment supports moving status forwards or backwards.',
      type: 'string'
    },
    properties: {
      label: 'Other Properties',
      description:
        'Any other default or custom company properties. Custom properties must be predefined in HubSpot. See more information in [HubSpot’s documentation](https://knowledge.hubspot.com/crm-setup/manage-your-properties#create-custom-properties).',
      type: 'object',
      defaultObjectUI: 'keyvalue:only',
      allowNull: false
    }
  },
  perform: (_request, _data) => {
    // Make your partner api request here!
    // return request('https://example.com', {
    //   method: 'post',
    //   json: data.payload
    // })
  }
}

export default action
