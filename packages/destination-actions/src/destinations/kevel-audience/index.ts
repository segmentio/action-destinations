import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import syncKevelAudience from './syncKevelAudience'

const destination: DestinationDefinition<Settings> = {
  name: 'Kevel Audience (Actions)',
  slug: 'actions-kevel-audience',
  description:
    "Share Segment user attributes and Segment Audiences from `track` and `identify` events to Kevel Audience using Kevel Audience tracking events and sharing data as `customFields`. By configuring Kevel Audience user attributes, this data can then be made available on the user's profile. Only users with a Segment userId will be synced.",
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      audienceDomain: {
        label: 'Kevel Audience Domain',
        description: 'Your Kevel Audience root subdomain. Example: "cdp.yourdomain.com".',
        type: 'string',
        required: true
      },
      userIdType: {
        label: 'Kevel Audience user ID Type to map your Segment ID to',
        description: 'The Kevel Audience User ID Type to use. Example: "crm".',
        type: 'string',
        required: true
      },
      clientId: {
        label: 'Kevel Audience client ID',
        description: 'The Kevel Audience client ID to identify the event. Example: "brand-name".',
        type: 'string',
        required: true
      },
      siteId: {
        label: 'Kevel Audience site ID',
        description: 'The Kevel Audience site ID to identify the event. Example: "segment-app".',
        type: 'string',
        required: true
      },
      apiKey: {
        label: 'Kevel Audience API Key',
        description:
          'The Kevel Audience API Key to authorize the requests. Get yours from your Customer Success representative.',
        type: 'string',
        required: true
      },
      eventType: {
        label: 'Event Type',
        description: 'The type of event to send to Kevel Audience. Example: "segmentSync".',
        type: 'string',
        required: true
      }
    }
  },
  extendRequest() {
    return {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  },
  actions: {
    syncKevelAudience
  }
}

export default destination
