import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import sendTrackEvent from './send-track-event'

/**
 * HubSpot Test Destination Settings Interface
 */
interface HubSpotTestSettings {
  /**
   * HubSpot API Key for authentication
   */
  api_key: string
  /**
   * Portal ID for the HubSpot account
   */
  portal_id?: string
}

/**
 * Complete Destination Definition for HubSpot Test
 */
const destination: DestinationDefinition<HubSpotTestSettings> = {
  /**
   * Human-friendly name displayed to users
   */
  name: 'HubSpot Test',

  /**
   * Programmatic slug for the destination
   */
  slug: 'hubspot-test-actions',

  /**
   * Description displayed to users
   */
  description: 'Send Segment track() events to HubSpot as custom behavioral events for enhanced contact engagement tracking and marketing automation.',

  /**
   * Authentication configuration for the destination
   */
  authentication: {
    scheme: 'custom',
    fields: {
      api_key: {
        label: 'HubSpot API Key',
        description: 'Your HubSpot API key. You can create one in your HubSpot account under Settings > Integrations > API key.',
        type: 'string',
        required: true
      },
      portal_id: {
        label: 'Portal ID',
        description: 'Your HubSpot Portal ID (Hub ID). You can find this in your HubSpot account settings.',
        type: 'string',
        required: false
      }
    }
  },

  /**
   * Function to extend requests with common headers and configuration
   */
  extendRequest({ settings }) {
    return {
      headers: {
        'Authorization': `Bearer ${settings.api_key}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Segment HubSpot Test Destination v1.0.0'
      }
    }
  },

  /**
   * Actions available for this destination
   */
  actions: {
    sendTrackEvent
  }
}

export default destination