import type { ActionDefinition, RequestClient } from '@segment/actions-core'
import { IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { event_metadata } from '../reddit-capi-event-metadata'
import { user_data_field, hash_user_data } from '../reddit-capi-user-data'
import type { Payload } from './generated-types'
import isEmpty from 'lodash/isEmpty'
import dayjs from '../../../lib/dayjs'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Report Conversion Event',
  description:
    'Report events directly to Reddit. Data shared can power Reddit solutions that will help evaluate ads effectiveness and improve content, targeting, and placement of future ads.',
  fields: {
    tracking_type: {
      label: 'Event Name/Type',
      description: 'The conversion event type. Please refer to the possible event types in Reddit API docs.',
      type: 'string',
      required: true,
      choices: [
        { label: 'Page Visit', value: 'PageVisit' },
        { label: 'View Content', value: 'ViewContent' },
        { label: 'Search', value: 'Search' },
        { label: 'Add to Cart', value: 'AddToCart' },
        { label: 'Add to Wishlist', value: 'AddToWishlist' },
        { label: 'Purchase', value: 'Purchase' },
        { label: 'Lead', value: 'Lead' },
        { label: 'Sign Up', value: 'SignUp' }
        // { label: 'Custom', value: 'custom' }
      ]
    },
    event_at: {
      label: 'Event Timestamp',
      description: 'The RFC3339 timestamp when the conversion event occurred.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    click_id: {
      label: 'Click ID',
      description: 'The Reddit-generated id associated with a single ad click.',
      type: 'string',
      allowNull: true
    },
    user_data: user_data_field,
    event_metadata: event_metadata
  },
  perform: async (request, { settings, payload }) => {
    return processPayload(request, settings, payload)
  }
}

async function processPayload(request: RequestClient, settings: Settings, payload: Payload) {
  if (
    isEmpty(payload.user_data?.email) &&
    isEmpty(payload.user_data?.aaid) &&
    isEmpty(payload.user_data?.idfa) &&
    isEmpty(payload.user_data?.ip_address) &&
    isEmpty(payload.user_data?.user_agent)
  ) {
    throw new IntegrationError(
      `User data must contain values for Email, AAID, IDFA, IP Address, or User Agent fields.`,
      'Misconfigured required field',
      400
    )
  }

  const data = createRedditPayload(payload)
  return request(`https://ads-api.reddit.com/api/v2.0/conversions/events/${settings.ad_account_id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${settings.conversion_token}` },
    json: {
      data: data
    }
  })
}

function createRedditPayload(payload: Payload) {
  return [
    {
      event_at: dayjs.utc(payload.event_at).unix(),
      event_type: {
        tracking_type: payload.tracking_type,
        //if adding a custom event - it would go here
      },
      click_id: payload.click_id,
      user: hash_user_data({ user_data: payload.user_data }),
      event_metadata: event_metadata
    }
  ]
}

export default action
