/**
 * Central API Versioning Information
 * 
 * This file contains API version constants for all destination integrations.
 * Having API versions in a central location makes it easier to:
 * - Track which API versions are being used across destinations
 * - Update API versions when destinations need to be upgraded
 * - Maintain consistency across related destinations
 * - Quickly identify destinations that may need updates
 * 
 * @module versioning-info
 */

/**
 * Actions Pardot API Version
 */
export const ACTIONS_PARDOT_API_VERSION = 'v5'

/**
 * Batch API Version
 */
export const BATCH_API_VERSION = 2.6

/**
 * Display & Video 360 (DV360) Google API Version
 */
export const DISPLAY_VIDEO_360_API_VERSION = 'v2'

/**
 * Facebook Conversions API Version
 */
export const FACEBOOK_CONVERSIONS_API_VERSION = '21.0'
export const FACEBOOK_CONVERSIONS_CANARY_API_VERSION = '21.0'

/**
 * Facebook Custom Audiences API Version
 */
export const FACEBOOK_CUSTOM_AUDIENCES_API_VERSION = 'v21.0'
export const FACEBOOK_CUSTOM_AUDIENCES_CANARY_API_VERSION = 'v21.0'

/**
 * LinkedIn Audiences API Version
 */
export const LINKEDIN_AUDIENCES_API_VERSION = '202505'

/**
 * Marketo Static Lists API Version
 */
export const MARKETO_STATIC_LISTS_API_VERSION = 'v1'

/**
 * Ortto API Version
 */
export const ORTTO_API_VERSION = 'v1'

/**
 * Ortto Audiences API Version
 */
export const ORTTO_AUDIENCES_API_VERSION = 'v1'

/**
 * Pinterest Conversions API Version
 */
export const PINTEREST_CONVERSIONS_API_VERSION = 'v5'

/**
 * Salesforce API Version
 */
export const SALESFORCE_API_VERSION = 'v53.0'

/**
 * The Trade Desk CRM API Version
 */
export const THE_TRADE_DESK_CRM_API_VERSION = 'v3'

/**
 * TikTok API Version (used across multiple TikTok destinations)
 */
export const TIKTOK_API_VERSION = 'v1.3'

/**
 * Vibe Audience API Version
 */
export const VIBE_AUDIENCE_API_VERSION = 'v1'

/**
 * Toplyne Base URL (includes version)
 */
export const TOPLYNE_BASE_URL = 'https://api.toplyne.io/v1'

/**
 * UserMotion Base URL (includes version)
 */
export const USERMOTION_BASE_URL = 'https://api.usermotion.com/v1'

/**
 * Prodeology Base URL (includes version)
 */
export const PRODEOLOGY_BASE_URL = 'https://api-dev.prodeology.com/api/v1'

/**
 * Gameball API Configuration
 */
export const GAMEBALL_CONFIG = {
  baseApiUrl: 'https://api.gameball.co',
  baseAuthUrl: 'https://auth.gameball.co',
  apiVersions: {
    testAuthentication: 'v1.0',
    integrations: 'v3.0'
  },
  endpoints: {
    testAuthentication: '/api/v1.0/protected/TestAuthentication',
    trackEvent: '/api/v3.0/integrations/event',
    trackOrder: '/api/v3.0/integrations/order',
    identifyPlayer: '/api/v3.0/integrations/player'
  }
} as const

/**
 * Responsys API Version
 */
export const RESPONSYS_API_VERSION = 'v1.3'

/**
 * Qualtrics API Version
 */
export const QUALTRICS_API_VERSION = 'v3'

/**
 * Nextdoor CAPI API Version
 */
export const NEXTDOOR_CAPI_API_VERSION = 'v2'

/**
 * Ambee API Version
 */
export const AMBEE_API_VERSION = 'v1'

/**
 * SurveySparrow API Version
 */
export const SURVEYSPARROW_API_VERSION = 'v3'

/**
 * Optimizely Feature Experimentation API Versions
 */
export const OPTIMIZELY_FEATURE_EXPERIMENTATION_API_VERSIONS = {
  subjectAccessRequests: 'v2',
  logEvents: 'v1'
} as const

/**
 * Salesforce Marketing Cloud API Versions
 */
export const SALESFORCE_MARKETING_CLOUD_API_VERSIONS = {
  auth: 'v2',
  interaction: 'v1',
  contacts: 'v1',
  hub: 'v1',
  data: 'v1'
} as const

/**
 * TikTok Base URL
 */
export const TIKTOK_BASE_URL = 'https://business-api.tiktok.com/open_api/'

/**
 * Attentive API Version
 */
export const ATTENTIVE_API_VERSION = 'v1'

/**
 * LinkedIn Conversions API Version
 */
export const LINKEDIN_CONVERSIONS_API_VERSION = '202505'

/**
 * Microsoft Bing Ads Audiences API Version
 */
export const MS_BING_ADS_AUDIENCES_API_VERSION = 'v13'

/**
 * First Party DV360 API Version
 */
export const FIRST_PARTY_DV360_API_VERSION = 'v4'
export const FIRST_PARTY_DV360_CANARY_API_VERSION = 'v4'

/**
 * Google Enhanced Conversions API Version
 */
export const GOOGLE_ENHANCED_CONVERSIONS_API_VERSION = 'v19'

/**
 * Google Sheets API Version
 */
export const GOOGLE_SHEETS_API_VERSION = 'v4'

/**
 * Aampe API Version (for regional endpoints)
 */
export const AAMPE_API_VERSION = 'v1'

/**
 * LiveLike Cloud API Version
 */
export const LIVELIKE_CLOUD_API_VERSION = 'v1'

/**
 * SendGrid Audiences API Version
 */
export const SENDGRID_AUDIENCES_API_VERSION = 'v3'

/**
 * Microsoft Bing CAPI API Version
 */
export const MS_BING_CAPI_API_VERSION = 'v1'

/**
 * Snap Audiences API Version
 */
export const SNAP_AUDIENCES_API_VERSION = 'v1'

/**
 * Reddit Audiences API Versions
 */
export const REDDIT_AUDIENCES_AUTH_API_VERSION = 'v1'
export const REDDIT_AUDIENCES_ADS_API_VERSION = 'v3'

/**
 * Voyage API Version
 */
export const VOYAGE_API_VERSION = 'v1'

/**
 * Metronome API Version
 */
export const METRONOME_API_VERSION = 'v1'

/**
 * Yotpo API Version
 */
export const YOTPO_API_VERSION = 'v2'

/**
 * Twilio Messaging API Versions
 */
export const TWILIO_MESSAGING_API_VERSION = '2010-04-01'
export const TWILIO_MESSAGING_SERVICES_API_VERSION = 'v1'
export const TWILIO_CONTENT_API_VERSION = 'v1'

/**
 * Aggregations.io API Version
 */
export const AGGREGATIONS_IO_API_VERSION = 'v1'

/**
 * Canvas API Version
 */
export const CANVAS_API_VERSION = 'v1'

/**
 * Pipedrive API Version
 */
export const PIPEDRIVE_API_VERSION = 'v1'

/**
 * Antavo API Version
 */
export const ANTAVO_API_VERSION = 'v1'

/**
 * ABsmartly API Version (used in collector endpoint)
 */
export const ABSMARTLY_API_VERSION = 'v1'

/**
 * Adobe Target API Version
 */
export const ADOBE_TARGET_API_VERSION = 'v1'

/**
 * Attio API Version
 */
export const ATTIO_API_VERSION = 'v1'

/**
 * 1plusX API Version
 */
export const ONEPLUSX_API_VERSION = 'v2'
