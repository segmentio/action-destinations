import { isString } from '@segment/actions-core'
import dayjs from 'dayjs'
import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import { Intercom } from '../api'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, Intercom, Payload> = {
  title: 'Update',
  description: '',
  platform: 'web',
  fields: {
    user_id: {
      type: 'string',
      required: false,
      description: "The user's identity",
      label: 'Identity',
      default: {
        '@path': '$.userId'
      }
    },
    traits: {
      type: 'object',
      required: false,
      description: 'The Segment traits to be forwarded to Intercom',
      label: 'Traits',
      default: {
        '@path': '$.traits'
      }
    },
    name: {
      type: 'string',
      required: false,
      description: "User's name",
      label: 'Name',
      default: {
        '@path': '$.traits.name'
      }
    },
    phone: {
      type: 'string',
      required: false,
      description: 'Phone number of the current user/lead',
      label: 'Phone',
      default: {
        '@path': '$.traits.phone'
      }
    },
    unsubscribed_from_emails: {
      type: 'boolean',
      required: false,
      description: 'Sets the [unsubscribe status] of the record',
      label: 'Unsubscribed from emails',
      default: {
        '@path': '$.traits.unsubscribedFromEmails'
      }
    },
    language_override: {
      type: 'string',
      required: false,
      description: 'The messenger language (instead of relying on browser language settings)',
      label: 'Language Override',
      default: {
        '@path': '$.traits.languageOverride'
      }
    },
    email: {
      type: 'string',
      required: false,
      description: "User's email",
      label: 'Name',
      default: {
        '@path': '$.traits.email'
      }
    },
    created_at: {
      label: 'Created at',
      description: 'A timestamp of when the person was created',
      required: false,
      type: 'datetime',
      default: {
        '@path': '$.traits.createdAt'
      }
    },
    avatar: {
      label: 'avatar',
      description:
        'The avatar/profile image associated to the current record (typically gathered via social profiles via email address)',
      required: false,
      type: 'object',
      default: {
        '@path': '$.traits.avatar'
      }
    },
    user_hash: {
      label: 'User Hash',
      description: 'Used for identity verification',
      required: false,
      type: 'string',
      default: {
        '@path': '$.traits.userHash'
      }
    },
    company: {
      label: 'Company',
      description: "The user's company",
      required: false,
      type: 'object',
      default: {
        '@path': '$.traits.company'
      }
    },
    companies: {
      label: 'Companies',
      description: 'An array of companies the user is associated to',
      required: false,
      multiple: true,
      type: 'object',
      default: {
        '@path': '$.traits.company'
      }
    }
  },
  perform: (Intercom, event) => {
    //copy over everything but traits; traits will not be sent in the payload
    const payload: { [k: string]: unknown } = {}
    for (const [key, value] of Object.entries(event.payload)) {
      if (key !== 'traits') {
        payload[key] = value
      }
    }

    //change date from ISO-8601 (segment's format) to unix timestamp (intercom's format)
    if (payload.created_at && isString(payload.created_at)) {
      payload.created_at = dayjs(payload.created_at).unix()
    }

    Intercom('update', {
      ...payload
    })
  }
}

export default action
