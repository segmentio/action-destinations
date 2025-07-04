import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { API_URL } from '../config'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify',
  description:
    'Identify (create or update) a customer for your app in Mantle, including any additional information about the customer',
  defaultSubscription: 'type = "identify"',
  fields: {
    platformId: {
      label: 'Shopify Shop ID',
      description:
        'The unique identifier for the Shopify shop. This is used to associate the customer with a Shopify shop in Mantle',
      type: 'string',
      required: true
    },
    myshopifyDomain: {
      label: 'Shopify Shop Domain',
      description:
        'The unique .myshopify.com domain of the Shopify shop. This is used to associate the customer with a Shopify shop in Mantle',
      type: 'string',
      required: true
    },
    name: {
      label: 'Name',
      description: 'The name of the customer / shop',
      type: 'string',
      required: false,
      default: { '@path': '$.traits.name' }
    },
    email: {
      label: 'Email',
      description: 'The email of the customer',
      type: 'string',
      required: false,
      default: { '@path': '$.traits.email' }
    },
    platformPlanName: {
      label: 'Platform Plan Name',
      description: 'The name of the plan the customer is on on the platform (Shopify)',
      type: 'string',
      required: false,
      default: { '@path': '$.traits.platformPlanName' }
    },
    customFields: {
      label: 'Custom Fields',
      description: 'The custom fields of the customer / shop',
      type: 'object',
      required: false,
      defaultObjectUI: 'keyvalue',
      default: {
        '@path': '$.traits.custom_fields'
      }
    },
    contactName: {
      label: 'Contact Name',
      description: 'The name of the contact / user',
      type: 'string',
      required: false,
      default: { '@path': '$.traits.contact_name' }
    },
    contactEmail: {
      label: 'Contact Email',
      description: 'The email of the contact / user',
      type: 'string',
      required: false,
      default: { '@path': '$.traits.contact_email' }
    },
    contactPhone: {
      label: 'Contact Phone',
      description: 'The phone number of the contact / user',
      type: 'string',
      required: false,
      default: { '@path': '$.traits.contact_phone' }
    },
    contactRole: {
      label: 'Contact Role',
      description: 'The role of the contact / user. For example primary, secondary, user, etc',
      type: 'string',
      required: false,
      default: { '@path': '$.traits.contact_role' }
    }
  },
  perform: (request, data) => {
    return request(`${API_URL}/identify`, {
      method: 'post',
      json: {
        platform: 'shopify',
        platformId: data.payload.platformId,
        myshopifyDomain: data.payload.myshopifyDomain,
        name: data.payload.name,
        email: data.payload.email,
        ...(data.payload.platformPlanName ? { platformPlanName: data.payload.platformPlanName } : {}),
        ...(data.payload.customFields ? { customFields: data.payload.customFields } : {}),
        ...(data.payload.contactEmail && data.payload.contactRole
          ? {
              contacts: [
                {
                  email: data.payload.contactEmail,
                  label: data.payload.contactRole,
                  ...(data.payload.contactPhone ? { phone: data.payload.contactPhone } : {}),
                  ...(data.payload.contactName ? { name: data.payload.contactName } : {})
                }
              ]
            }
          : {})
      }
    })
  }
}

export default action
