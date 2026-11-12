import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { upsertMember, upsertMemberBatch } from '../utils'
import { SUBSCRIPTION_STATUSES, DEFAULT_BATCH_SIZE } from '../constants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add or Update Audience Member',
  description:
    'Add a new member to a Mailchimp audience or update an existing member, mapping Segment traits to merge fields.',
  defaultSubscription: 'type = "identify"',
  fields: {
    email_address: {
      label: 'Email Address',
      description:
        'The email address of the audience member. Used to identify the member (hashed for the API endpoint).',
      type: 'string',
      format: 'email',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      }
    },
    list_id: {
      label: 'Audience ID',
      description:
        'The Mailchimp Audience (List) ID to add the member to. Defaults to the Audience ID configured in settings.',
      type: 'string',
      required: false
    },
    status_if_new: {
      label: 'Status (if new)',
      description:
        'The subscription status to apply only when creating a new member. Protects the consent status of existing members.',
      type: 'string',
      required: true,
      default: 'subscribed',
      choices: SUBSCRIPTION_STATUSES.map((value) => ({ value, label: value }))
    },
    status: {
      label: 'Status',
      description:
        'The subscription status to apply to the member. Applies to existing members too — use with care to respect consent.',
      type: 'string',
      required: false,
      choices: SUBSCRIPTION_STATUSES.map((value) => ({ value, label: value }))
    },
    merge_fields: {
      label: 'Merge Fields',
      description: 'Mailchimp merge fields (e.g. FNAME, LNAME, and custom fields), keyed by the Mailchimp merge tag.',
      type: 'object',
      required: false,
      defaultObjectUI: 'keyvalue'
    },
    language: {
      label: 'Language',
      description: "The member's language (e.g. en).",
      type: 'string',
      required: false,
      default: { '@path': '$.context.locale' }
    },
    vip: {
      label: 'VIP',
      description: 'Whether the member is a VIP.',
      type: 'boolean',
      required: false
    },
    tags: {
      label: 'Tags',
      description: 'Tags to apply to the member on creation or update.',
      type: 'string',
      multiple: true,
      required: false
    },
    enable_batching: {
      label: 'Batch Data',
      description: 'When enabled, sends events to Mailchimp in batches.',
      type: 'boolean',
      default: true
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
      type: 'number',
      required: false,
      unsafe_hidden: true,
      default: DEFAULT_BATCH_SIZE,
      minimum: 1,
      maximum: DEFAULT_BATCH_SIZE
    },
    batch_keys: {
      label: 'Batch Keys',
      description: 'The keys to use for batching the events.',
      type: 'string',
      unsafe_hidden: true,
      required: false,
      multiple: true,
      default: ['list_id']
    }
  },
  perform: (request, { settings, payload }) => {
    return upsertMember(request, settings, payload)
  },
  performBatch: (request, { settings, payload }) => {
    return upsertMemberBatch(request, settings, payload)
  }
}

export default action
