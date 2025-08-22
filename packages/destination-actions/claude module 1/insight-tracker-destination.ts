import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import sendEvent from './insight-tracker-action'

/**
 * InsightTracker Destination Settings Interface
 */
interface InsightTrackerSettings {
  /**
   * API Key for authenticating with InsightTracker
   */
  api_key: string
  /**
   * Data region for InsightTracker (US, EU, APAC)
   */
  region: string
  /**
   * Enable debug mode for additional logging
   */
  debug_mode: boolean
}

/**
 * Complete Destination Definition for InsightTracker
 */
const destination: DestinationDefinition<InsightTrackerSettings> = {
  /**
   * Human-friendly name displayed to users
   */
  name: 'InsightTracker',

  /**
   * Programmatic slug for the destination
   */
  slug: 'insight-tracker-actions',

  /**
   * Description displayed to users
   */
  description: 'Send analytics events to InsightTracker for comprehensive user behavior tracking and business intelligence.',

  /**
   * Authentication configuration for the destination
   */
  authentication: {
    scheme: 'custom',
    fields: {
      api_key: {
        label: 'API Key',
        description: 'Your InsightTracker API key. You can find this in your InsightTracker dashboard under Settings > API Keys.',
        type: 'string',
        required: true
      },
      region: {
        label: 'Data Region',
        description: 'The data region where your InsightTracker instance is hosted.',
        type: 'string',
        required: true,
        choices: [
          { label: 'United States (US)', value: 'us' },
          { label: 'Europe (EU)', value: 'eu' },
          { label: 'Asia Pacific (APAC)', value: 'apac' }
        ],
        default: 'us'
      },
      debug_mode: {
        label: 'Debug Mode',
        description: 'Enable debug mode to log additional information for troubleshooting.',
        type: 'boolean',
        required: false,
        default: false
      }
    }
  },

  /**
   * Function to extend requests with common headers and configuration
   */
  extendRequest({ settings }) {
    const baseUrl = {
      us: 'https://api.insighttracker.com',
      eu: 'https://eu.api.insighttracker.com', 
      apac: 'https://apac.api.insighttracker.com'
    }[settings.region] || 'https://api.insighttracker.com'

    return {
      prefixUrl: baseUrl,
      headers: {
        'Authorization': `Bearer ${settings.api_key}`,
        'Content-Type': 'application/json',
        'X-Client-Name': 'segment-actions',
        'X-Client-Version': '1.0.0',
        'X-Debug-Mode': settings.debug_mode ? 'true' : 'false'
      }
    }
  },

  /**
   * Actions available for this destination
   */
  actions: {
    sendEvent
  }
}

export default destination