import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify Contact',
  description: 'Create or update a contact in Gleap',
  defaultSubscription: 'type = "identify"',
  fields: {
    userId: {
      type: 'string',
      required: true,
      description: 'A unique identifier for the contact.',
      label: 'User ID',
      default: {
        '@path': '$.userId'
      }
    },
    name: {
      type: 'string',
      description: "The contact's name.",
      label: 'Name',
      default: {
        '@path': '$.traits.name'
      }
    },
    email: {
      type: 'string',
      description: "The contact's email address.",
      label: 'Email Address',
      format: 'email',
      default: {
        '@if': {
          exists: { '@path': '$.email' },
          then: { '@path': '$.email' },
          else: { '@path': '$.traits.email' }
        }
      }
    },
    phone: {
      label: 'Phone Number',
      description: "The contact's phone number.",
      type: 'string',
      default: {
        '@path': '$.traits.phone'
      }
    },
    companyName: {
      label: 'Company Name',
      description: "The contact's company name.",
      type: 'string',
      default: {
        '@path': '$.traits.company.name'
      }
    },
    companyId: {
      label: 'Company ID',
      description: "The contact's compan ID",
      type: 'string',
      default: {
        '@path': '$.traits.company.id'
      }
    },
    lang: {
      label: 'Language',
      description: "The user's language.",
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.language' },
          then: { '@path': '$.traits.language' },
          else: 'en'
        }
      }
    },
    plan: {
      label: 'Subscription Plan',
      description: "The user's subscription plan.",
      type: 'string',
      required: false,
      default: { '@path': '$.traits.plan' }
    },
    value: {
      label: 'User Value',
      description: "The user's value.",
      type: 'number',
      required: false
    },
    lastPageView: {
      label: 'Last Page View',
      type: 'string',
      description: 'The page where the contact was last seen.',
      default: {
        '@path': '$.context.page.url'
      }
    },
    createdAt: {
      label: 'Signed Up Timestamp',
      type: 'datetime',
      description: 'The time specified for when a contact signed up.'
    },
    lastActivity: {
      label: 'Last Seen Timestamp',
      type: 'datetime',
      description: 'The time when the contact was last seen.',
      default: {
        '@path': '$.timestamp'
      }
    },
    customAttributes: {
      label: 'Custom Attributes',
      description: 'The custom attributes which are set for the contact.',
      type: 'object',
      defaultObjectUI: 'keyvalue'
    }
  },
  perform: async (request, { payload }) => {
    // Map the payload to the correct format.
    payload = {
      ...payload,
      lang: payload.lang ? payload.lang.toLowerCase() : 'en',
      ...payload.customAttributes
    }

    // Remove the customAttributes field from the payload.
    delete payload.customAttributes

    // Map the lastPageView and lastActivity to the correct format.
    if (payload.lastPageView) {
      payload.lastPageView = {
        page: payload.lastPageView,
        date: payload.lastActivity
      }
    }

    return request('https://api.gleap.io/admin/identify', {
      method: 'POST',
      json: payload
    })
  }
}

export default action
