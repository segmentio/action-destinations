import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { updateMemberTags } from '../utils'
import { TAG_STATUSES } from '../constants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add or Remove Member Tags',
  description:
    'Apply or remove Mailchimp audience tags on an existing member based on behavioral events. The member must already exist in the audience.',
  defaultSubscription: 'type = "track"',
  fields: {
    email: {
      label: 'Email Address',
      description:
        'The email address of the audience member whose tags will be updated. Used to identify the member (hashed for the API endpoint).',
      type: 'string',
      format: 'email',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.properties.email' },
          then: { '@path': '$.properties.email' },
          else: { '@path': '$.traits.email' }
        }
      }
    },
    list_id: {
      label: 'Audience ID',
      description:
        'The Mailchimp Audience (List) ID the member belongs to. Defaults to the Audience ID configured in settings.',
      type: 'string',
      required: false
    },
    tags: {
      label: 'Tags',
      description: 'Tags to apply or remove, each with a name and a status of "active" (add) or "inactive" (remove).',
      type: 'object',
      multiple: true,
      required: false,
      properties: {
        name: {
          label: 'Tag Name',
          description: 'The name of the tag.',
          type: 'string',
          required: true
        },
        status: {
          label: 'Status',
          description: 'Whether to add ("active") or remove ("inactive") the tag.',
          type: 'string',
          required: true,
          choices: TAG_STATUSES.map((value) => ({ value, label: value }))
        }
      }
    },
    tags_to_add: {
      label: 'Tags to Add',
      description: 'A convenience list of tag names to add (status "active"). Defaults to the event name.',
      type: 'string',
      multiple: true,
      required: false,
      default: { '@path': '$.event' }
    },
    tags_to_remove: {
      label: 'Tags to Remove',
      description: 'A convenience list of tag names to remove (status "inactive").',
      type: 'string',
      multiple: true,
      required: false
    }
  },
  perform: (request, { settings, payload }) => {
    return updateMemberTags(request, settings, payload)
  }
}

export default action
