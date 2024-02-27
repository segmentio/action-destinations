import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import omit from 'lodash/omit'
import pick from 'lodash/pick'

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
    firstName: {
      type: 'string',
      description: "The contact's first name.",
      label: 'First name',
      default: {
        '@path': '$.properties.first_name'
      }
    },
    lastName: {
      type: 'string',
      description: "The contact's last name.",
      label: 'Last name',
      default: {
        '@path': '$.properties.last_name'
      }
    },
    email: {
      type: 'string',
      description: "The contact's email address.",
      label: 'Email Address',
      format: 'email',
      default: { '@path': '$.traits.email' }
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
      default: { '@path': '$.context.locale' }
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
      defaultObjectUI: 'keyvalue',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: async (request, { payload }) => {
    // Map the payload to the correct format.
    const defaultUserFields = [
      'userId',
      'email',
      'phone',
      'companyName',
      'companyId',
      'lang',
      'plan',
      'value',
      'createdAt',
      'lastActivity'
    ]

    const identifyPayload: any = {
      // Add the name if it exists.
      ...(payload.firstName || payload.lastName
        ? {
            name: `${payload.firstName} ${payload.lastName}`.trim()
          }
        : {}),

      // Pick the default user fields.
      ...pick(payload, defaultUserFields),

      // Add custom data but omit the default user fields.
      ...omit(payload.customAttributes, [...defaultUserFields, 'firstName', 'lastName'])
    }

    // Map the lastPageView and lastActivity to the correct format.
    if (payload.lastPageView) {
      identifyPayload.lastPageView = {
        page: payload.lastPageView,
        date: payload.lastActivity
      }
    }

    return request('https://api.gleap.io/admin/identify', {
      method: 'POST',
      json: identifyPayload
    })
  }
}

export default action
