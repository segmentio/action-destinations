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
        'An array of objects containing key-value pairs of mailing list IDs as `listId` and a true/false `subscribed` value determining if the contact should be added to or removed from each list.',
      type: 'object',
      multiple: true,
      required: false,
      properties: {
        listId: {
          label: 'List ID',
          description: 'The ID of the mailing list.',
          type: 'string',
          required: true
        },
        subscribed: {
          label: 'subscribed',
          description:
            'true indicates that the user is to be added to the list, false will remove the user from the list.',
          type: 'boolean',
          required: true
        }
      },
      default: {
        '@arrayPath': [
          '$.traits.mailingLists',
          {
            listId: {
              '@path': '$.listId'
            },
            subscribed: {
              '@path': '$.subscribed'
            }
          }
        ]
      }
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
    const { customAttributes, ...rest } = payload

    /* Re-shape mailing list data from a list of objects to a single object for the API */
    const formattedMailingLists: Record<string, boolean> = {}
    type listObj = { listId: string; subscribed: boolean }
    if (payload.mailingLists) {
      for (const list of Object.values(payload.mailingLists)) {
        if (typeof list === 'object' && 'listId' in list && 'subscribed' in list) {
          formattedMailingLists[(list as listObj).listId] = (list as listObj).subscribed
        }
      }
    }

    /* Now delete the mailingLists data from traits/customAttributes */
    if (typeof customAttributes === 'object' && 'mailingLists' in customAttributes) {
      delete customAttributes.mailingLists
    }

    return request('https://app.loops.so/api/v1/contacts/update', {
      method: 'put',
      json: {
        ...(typeof customAttributes === 'object' && customAttributes),
        ...rest,
        mailingLists: formattedMailingLists
      }
    })
  }
}

export default action
