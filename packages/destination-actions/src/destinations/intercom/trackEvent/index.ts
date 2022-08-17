import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { convertValidTimestamp, getUniqueIntercomContact } from '../util'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Submit an event to Intercom.',
  defaultSubscription: 'type = "track"',
  fields: {
    event_name: {
      type: 'string',
      required: true,
      description:
        'The name of the event that occurred. Names are treated as case insensitive. Periods and dollar signs in event names are replaced with hyphens.',
      label: 'Event Name',
      default: {
        '@path': '$.event'
      }
    },
    created_at: {
      type: 'datetime',
      required: true,
      description:
        'The time the event occurred as a UTC Unix timestamp. Segment will convert to Unix if not already converted.',
      label: 'Event Timestamp',
      default: {
        '@path': '$.timestamp'
      }
    },
    user_id: {
      type: 'string',
      description:
        'Your identifier for the user who performed the event. User ID is required if no email or Contact ID is provided.',
      label: 'User ID',
      default: {
        '@path': '$.userId'
      }
    },
    email: {
      type: 'string',
      description:
        'The email address for the user who performed the event. Email is required if no User ID or Contact ID is provided.',
      label: 'Email Address',
      format: 'email',
      default: {
        '@path': '$.properties.email'
      }
    },
    revenue: {
      label: 'Revenue',
      type: 'number',
      description:
        'The amount associated with a purchase. Segment will multiply by 100 as Intercom requires the amount in cents.',
      default: {
        '@path': '$.properties.revenue'
      }
    },
    currency: {
      label: 'Currency',
      type: 'string',
      description:
        'The currency of the purchase amount. Segment will default to USD if revenue is provided without a currency.',
      default: {
        '@path': '$.properties.currency'
      }
    },
    id: {
      label: 'Contact ID',
      description:
        "Intercom's unique identifier for the contact. If no Contact ID is provided, Segment will use User ID or Email to find a user or lead.",
      type: 'string'
    },
    metadata: {
      type: 'object',
      description:
        'Optional metadata describing the event. Each event can contain up to ten metadata key-value pairs. If you send more than ten keys, Intercom will ignore the rest. Intercom does not support nested JSON structures within metadata.',
      label: 'Event Metadata',
      default: {
        '@path': '$.properties'
      }
    }
  },
  perform: async (request, { payload }) => {
    payload.created_at = convertValidTimestamp(payload.created_at)
    delete payload.metadata?.email

    // If only an email is passed, then this might be a lead - so retrieve the contact
    if (payload.email && !payload.user_id && !payload.id) {
      const contact = await getUniqueIntercomContact(request, payload)
      if (contact) {
        payload.id = contact.id
      } else {
        throw new IntegrationError('No unique contact found', 'Contact not found', 404)
      }
    }

    possiblyPopulatePrice(payload)

    return request('https://api.intercom.io/events', {
      method: 'POST',
      json: payload
    })
  }
}

/**
 * If revenue (and possibly currency) is set, then transform and move
 * the attributes into a price object inside metadata
 */
function possiblyPopulatePrice(payload: Payload) {
  const { revenue, currency } = payload
  delete payload.revenue
  delete payload.currency
  delete payload.metadata?.revenue
  delete payload.metadata?.currency

  if (revenue || revenue === 0) {
    if (!payload.metadata) {
      payload.metadata = {}
    }

    payload.metadata.price = {
      amount: revenue * 100, //intercom requires amounts in cents
      currency: currency || 'USD' //currency defaults to USD
    }
  }
}

export default action
