import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create or update a contact',
  description: 'Create or update a contact in Loops',
  defaultSubscription: 'type = "identify"',
  fields: {
    createdAt: {
      label: 'Contact Created Date',
      description: 'Date the contact was created.',
      type: 'datetime',
      format: 'date-time',
      required: false
    },
    customAttributes: {
      label: 'Custom Contact Attributes',
      description: 'Contact attributes maintained by your team.',
      type: 'object',
      required: false,
      default: { '@path': '$.traits' }
    },
    email: {
      label: 'Contact Email',
      description: 'Email address for the contact. This is required when creating new contacts.',
      type: 'string',
      format: 'email',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.email' }
        }
      }
    },
    firstName: {
      label: 'First Name',
      description: "The contact's given name.",
      type: 'string',
      required: false,
      default: { '@path': '$.traits.firstName' }
    },
    lastName: {
      label: 'Last Name',
      description: "The contact's surname.",
      type: 'string',
      required: false,
      default: { '@path': '$.traits.lastName' }
    },
    mailingLists: {
      label: 'Mailing Lists',
      description:
        'Key-value pairs of mailing list IDs and a boolean denoting if the contact should be added (true) or removed (false) from the list. Input list IDs as keys on the right, and a boolean true or false value on the left.',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      required: false
    },
    source: {
      label: 'Source',
      description: "The contact's source.",
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.source' },
          then: { '@path': '$.traits.source' },
          else: 'Segment'
        }
      }
    },
    subscribed: {
      label: 'Subscribed',
      description: 'Whether the contact is subscribed to email.',
      type: 'boolean',
      required: false
    },
    userGroup: {
      label: 'User Group',
      description: "The contact's user group.",
      type: 'string',
      required: false,
      default: { '@path': '$.traits.userGroup' }
    },
    userId: {
      label: 'User ID',
      description: 'User ID for the contact.',
      type: 'string',
      format: 'text',
      required: true,
      default: {
        '@path': '$.userId'
      }
    }
  },
  perform: (request, { payload }) => {
    const { customAttributes, mailingLists, ...rest } = payload

    let mailingListsToUse = mailingLists

    // mailingLists may be in traits (customAttributes)
    if (!mailingLists || Object.keys(mailingLists).length === 0) {
      if (customAttributes && typeof customAttributes === 'object' && 'mailingLists' in customAttributes) {
        mailingListsToUse = customAttributes.mailingLists as { [k: string]: boolean } | undefined
      }
    }

    // Process mailing list data
    let filteredMailingLists: { [key: string]: boolean } | undefined
    if (mailingListsToUse) {
      filteredMailingLists = filterMailingLists(mailingListsToUse)
    }

    // Now delete the mailingLists data from traits/customAttributes
    if (typeof customAttributes === 'object' && 'mailingLists' in customAttributes) {
      delete customAttributes.mailingLists
    }

    return request('https://app.loops.so/api/v1/contacts/update', {
      method: 'put',
      json: {
        ...(typeof customAttributes === 'object' && customAttributes),
        ...rest,
        mailingLists: filteredMailingLists || {}
      }
    })
  }
}

export default action

// remove any key value pairs where the value is not a true or false string
function filterMailingLists(obj: { [key: string]: unknown }): { [key: string]: boolean } {
  const result: { [key: string]: boolean } = {}
  for (const key in obj) {
    const value = obj[key]

    if (typeof value === 'string') {
      if (value === 'true') {
        result[key] = true
      } else if (value === 'false') {
        result[key] = false
      }
    } else if (typeof value === 'boolean') {
      result[key] = value
    }
  }
  return result
}
