import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import syncKevelAudience from './syncKevelAudience'

const destination: DestinationDefinition<Settings> = {
  name: 'Kevel Audience (Actions)',
  slug: 'actions-kevel-audience',
  description:
    'Sync Segment user profile traits and Engage Audiences to Kevel Audiences. Only users with a Segment userId will be synced.',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      audienceDomain: {
        label: 'Kevel Audience Domain',
        description: 'Your Kevel Audience root subdomain. For example: "cdp.yourdomain.com".',
        type: 'string',
        required: true
      },
      userIdType: {
        label: 'Kevel Audience User ID Type',
        description: 'Kevel Audience User ID Type to map your Segment User ID to. For example: "crm".',
        type: 'string',
        required: true
      },
      clientId: {
        label: 'Kevel Audience client ID',
        description: 'The Kevel Audience client ID to identify the event. For example: "brand-name".',
        type: 'string',
        required: true
      },
      siteId: {
        label: 'Kevel Audience site ID',
        description: 'The Kevel Audience site ID to identify the event. For example: "segment-app".',
        type: 'string',
        required: true
      },
      apiKey: {
        label: 'Kevel Audience API Key',
        description:
          'The Kevel Audience API Key to authorize the requests. Get yours from your Kevel Customer Success representative.',
        type: 'string',
        required: true
      },
      eventType: {
        label: 'Event Type',
        description: 'The type of event to send to Kevel Audience. For example: "segmentSync".',
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
