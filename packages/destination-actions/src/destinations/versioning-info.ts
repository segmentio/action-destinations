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
 * Each block comment now includes a `Used by:` line listing destinations relying on that constant.
 * Sorted alphabetically by constant name for easier scanning & maintenance.
 */

/** ACTIONS_PARDOT_API_VERSION
 * Used by: actions-pardot
 * Endpoint: /api/v5/objects/prospects/do/upsertLatestByEmail
 */
export const ACTIONS_PARDOT_API_VERSION = 'v5'

/** AAMPE_API_VERSION
 * Used by: aampe
 * Endpoint: /{region}/v1/
 */
export const AAMPE_API_VERSION = 'v1'

/** ADOBE_TARGET_API_VERSION
 * Used by: adobe-target
 * Endpoint: /rest/v1/profiles/thirdPartyId/{userId}
 */
export const ADOBE_TARGET_API_VERSION = 'v1'

/** AGGREGATIONS_IO_API_VERSION
 * Used by: aggregations-io
 * Endpoint: /api/v1
 */
export const AGGREGATIONS_IO_API_VERSION = 'v1'

/** AIRSHIP_API_VERSION
 * Used by: airship
 * Endpoint: application/vnd.urbanairship+json; version=3
 */
export const AIRSHIP_API_VERSION = '3'

/** ALGOLIA_INSIGHTS_API_VERSION
 * Used by: algolia-insights
 * Endpoint: /1/events
 */
export const ALGOLIA_INSIGHTS_API_VERSION = '1'

/** AMAZON_AMC_API_VERSION
 * Used by: amazon-amc
 * Endpoint: /amc/v2/*
 */
export const AMAZON_AMC_API_VERSION = 'v1'
export const AMAZON_AMC_AUTH_API_VERSION = 'v2'

/** AMAZON_CONVERSIONS_API_PROFILES_VERSION
 * Used by: amazon-conversions-api (profiles)
 * Endpoint: /attribution/v2/profiles
 */
export const AMAZON_CONVERSIONS_API_PROFILES_VERSION = 'v2'

/** AMAZON_CONVERSIONS_API_EVENTS_VERSION
 * Used by: amazon-conversions-api (events)
 * Endpoint: /attribution/v1/events
 */
export const AMAZON_CONVERSIONS_API_EVENTS_VERSION = 'v1'

/** AMBEE_API_VERSION
 * Used by: ambee
 * Endpoint: /v1/*
 */
export const AMBEE_API_VERSION = 'v1'

/** AMPLITUDE_API_VERSION
 * Used by: amplitude
 * Endpoint: /2/httpapi, /api/2/deletions/users, /api/2/usersearch
 */
export const AMPLITUDE_API_VERSION = '2'

/** ANGLER_AI_API_VERSION
 * Used by: angler-ai
 * Endpoint: /v1/*
 */
export const ANGLER_AI_API_VERSION = 'v1'

/** ANTAVO_API_VERSION
 * Used by: antavo
 * Endpoint: /v1/*
 */
export const ANTAVO_API_VERSION = 'v1'

/** ATTENTIVE_API_VERSION
 * Used by: attentive
 * Endpoint: /v1/*
 */
export const ATTENTIVE_API_VERSION = 'v1'

/** ATTIO_API_VERSION
 * Used by: attio
 * Endpoint: /v2/*
 */
export const ATTIO_API_VERSION = 'v2'

/** ATTIO_AUTH_API_VERSION
 * Used by: attio (auth)
 * Endpoint: /v1/oauth/token
 */
export const ATTIO_AUTH_API_VERSION = 'v1'

/** AVO_API_VERSION
 * Used by: avo
 * Endpoint: /v1/*
 */
export const AVO_API_VERSION = 'v1'

/** BATCH_API_VERSION
 * Used by: batch
 * Endpoint: /2.6/*
 */
export const BATCH_API_VERSION = 2.6

/** BLACKBAUD_API_VERSION
 * Used by: blackbaud-raisers-edge-nxt
 * Endpoint: /v1/*
 */
export const BLACKBAUD_API_VERSION = 'v1'

/** CANVAS_API_VERSION
 * Used by: canvas
 * Endpoint: /v1/*
 */
export const CANVAS_API_VERSION = 'v1'

/** CLEVERTAP_API_VERSION
 * Used by: clevertap
 * Endpoint: /1/*
 */
export const CLEVERTAP_API_VERSION = '1'

/** CLOSE_API_VERSION
 * Used by: close
 * Endpoint: /v1/*
 */
export const CLOSE_API_VERSION = 'v1'

/** CRITEO_AUDIENCES_API_VERSION
 * Used by: criteo-audiences
 * Endpoint: /2023-10/*
 */
export const CRITEO_AUDIENCES_API_VERSION = '2023-10'

/** CUSTOMERIO_TRACK_API_VERSION
 * Used by: customerio (track endpoints)
 * Endpoint: /v2/entity
 */
export const CUSTOMERIO_TRACK_API_VERSION = 'v2'

/** CUSTOMERIO_CUSTOMERS_API_VERSION
 * Used by: customerio (customers endpoint)
 * Endpoint: /v1/customers/{identifier}
 */
export const CUSTOMERIO_CUSTOMERS_API_VERSION = 'v1'

/** DAWN_API_VERSION
 * Used by: dawn
 * Endpoint: /v1/*
 */
export const DAWN_API_VERSION = 'v1'

/** DISPLAY_VIDEO_360_AUDIENCE_PARTNER_API_VERSION
 * Used by: display-video-360
 * Endpoint: /v2/*
 */
export const DISPLAY_VIDEO_360_AUDIENCE_PARTNER_API_VERSION = 'v2'

/** DOTDIGITAL_API_VERSION
 * Used by: dotdigital (general endpoints)
 * Endpoint: /v2/*
 */
export const DOTDIGITAL_API_VERSION = 'v2'

/** DOTDIGITAL_CONTACTS_API_VERSION
 * Used by: dotdigital (contacts endpoints)
 * Endpoint: /contacts/v3
 */
export const DOTDIGITAL_CONTACTS_API_VERSION = 'v3'

/** DRIP_API_VERSION
 * Used by: drip
 * Endpoint: /v2/*
 */
export const DRIP_API_VERSION = 'v2'

/** ENCHARGE_INGEST_API_VERSION
 * Used by: encharge
 * Endpoint: /v1/track
 */
export const ENCHARGE_INGEST_API_VERSION = 'v1'

/** ENGAGE_MESSAGING_SENDGRID_API_VERSION
 * Used by: engage-messaging-sendgrid
 * Endpoint: /v3/mail/send
 */
export const ENGAGE_MESSAGING_SENDGRID_API_VERSION = 'v3'

/** ENGAGE_MESSAGING_TWILIO_API_VERSION
 * Used by: engage-messaging-twilio
 * Endpoint: /v1/*
 */
export const ENGAGE_MESSAGING_TWILIO_API_VERSION = 'v1'

/** EMARSYS_API_VERSION
 * Used by: emarsys
 * Endpoint: /v2/*
 */
export const EMARSYS_API_VERSION = 'v2'

/** FACEBOOK_CONVERSIONS_API_VERSION
 * Used by: facebook-conversions-api
 * Endpoint: /v21.0/{pixel-id}/events
 */
export const FACEBOOK_CONVERSIONS_API_VERSION = '21.0'

/** FACEBOOK_CONVERSIONS_CANARY_API_VERSION
 * Used by: facebook-conversions-api (canary)
 * Endpoint: /v21.0/{pixel-id}/events
 */
export const FACEBOOK_CONVERSIONS_CANARY_API_VERSION = '21.0'

/** FACEBOOK_CUSTOM_AUDIENCES_API_VERSION
 * Used by: facebook-custom-audiences
 * Endpoint: /v21.0/{audience-id}/users
 */
export const FACEBOOK_CUSTOM_AUDIENCES_API_VERSION = 'v21.0'

/** FACEBOOK_CUSTOM_AUDIENCES_CANARY_API_VERSION
 * Used by: facebook-custom-audiences (canary)
 * Endpoint: /v21.0/{audience-id}/users
 */
export const FACEBOOK_CUSTOM_AUDIENCES_CANARY_API_VERSION = 'v21.0'

/** FIRST_PARTY_DV360_API_VERSION
 * Used by: first-party-dv360
 * Endpoint: /v4/*
 */
export const FIRST_PARTY_DV360_API_VERSION = 'v4'

/** FIRST_PARTY_DV360_CANARY_API_VERSION
 * Used by: first-party-dv360 (canary)
 * Endpoint: /v4/*
 */
export const FIRST_PARTY_DV360_CANARY_API_VERSION = 'v4'

/** FRIENDBUY_MAPI_VERSION
 * Used by: friendbuy
 * Endpoint: /v1/*
 */
export const FRIENDBUY_MAPI_VERSION = 'v1'

/** FULLSTORY_API_VERSION
 * Used by: fullstory
 * Endpoint: /v1/*
 */
export const FULLSTORY_API_VERSION = 'v1'

/** GAINSIGHT_PX_API_VERSION
 * Used by: gainsight-px-cloud-action
 * Endpoint: /v1/*
 */
export const GAINSIGHT_PX_API_VERSION = 'v1'

/** GAMEBALL_API_VERSION
 * Used by: gameball (game endpoints)
 * Endpoint: /v3.0/*
 */
export const GAMEBALL_API_VERSION = 'v3.0'

/** GAMEBALL_AUTH_API_VERSION
 * Used by: gameball (auth endpoints)
 * Endpoint: /v1.0/*
 */
export const GAMEBALL_AUTH_API_VERSION = 'v1.0'

/** GOOGLE_CAMPAIGN_MANAGER_360_API_VERSION
 * Used by: google-campaign-manager-360
 * Endpoint: /v4/*
 */
export const GOOGLE_CAMPAIGN_MANAGER_360_API_VERSION = 'v4'

/** GOOGLE_ENHANCED_CONVERSIONS_API_VERSION
 * Used by: google-enhanced-conversions
 * Endpoint: /v19/customers/{customer-id}/*
 */
export const GOOGLE_ENHANCED_CONVERSIONS_API_VERSION = 'v19'

/** GOOGLE_ENHANCED_CONVERSIONS_EVENTS_API_VERSION
 * Used by: google-enhanced-conversions (events endpoint)
 * Endpoint: /v1/*
 */
export const GOOGLE_ENHANCED_CONVERSIONS_EVENTS_API_VERSION = 'v1'

/** GOOGLE_SHEETS_API_VERSION
 * Used by: google-sheets, google-sheets-dev
 * Endpoint: /v4/spreadsheets/*
 */
export const GOOGLE_SHEETS_API_VERSION = 'v4'

/** HILO_API_VERSION
 * Used by: hilo
 * Endpoint: /v1/*
 */
export const HILO_API_VERSION = 'v1'

/** HUBSPOT_CRM_API_VERSION
 * Used by: hubspot (CRM objects)
 * Endpoint: /crm/v3/objects/*
 */
export const HUBSPOT_CRM_API_VERSION = 'v3'

/** HUBSPOT_CRM_ASSOCIATIONS_API_VERSION
 * Used by: hubspot (associations)
 * Endpoint: /crm/v4/associations/*
 */
export const HUBSPOT_CRM_ASSOCIATIONS_API_VERSION = 'v4'

/** HUBSPOT_OAUTH_API_VERSION
 * Used by: hubspot (oauth)
 * Endpoint: /oauth/v1/token
 */
export const HUBSPOT_OAUTH_API_VERSION = 'v1'

/** HYPERENGAGE_API_VERSION
 * Used by: hyperengage
 * Endpoint: /v1/*
 */
export const HYPERENGAGE_API_VERSION = 'v1'

/** INSIDER_UNIFICATION_API_VERSION
 * Used by: insider-audiences
 * Endpoint: /v1/*
 */
export const INSIDER_UNIFICATION_API_VERSION = 'v1'

/** KLAVIYO_REVISION_DATE
 * Used by: klaviyo (revision date header)
 * Endpoint: /api/* (revision: 2025-01-15)
 */
export const KLAVIYO_REVISION_DATE = '2025-01-15'

/** LAUNCHDARKLY_AUDIENCES_API_VERSION
 * Used by: launchdarkly-audiences
 * Endpoint: /api/v2/*
 */
export const LAUNCHDARKLY_AUDIENCES_API_VERSION = 'v2'

/** LINKEDIN_AUDIENCES_API_VERSION
 * Used by: linkedin-audiences
 * Endpoint: /rest/* (version: 202505)
 */
export const LINKEDIN_AUDIENCES_API_VERSION = '202505'

/** LINKEDIN_CONVERSIONS_API_VERSION
 * Used by: linkedin-conversions
 * Endpoint: /rest/* (version: 202505)
 */
export const LINKEDIN_CONVERSIONS_API_VERSION = '202505'

/** LISTRAK_API_VERSION
 * Used by: listrak
 * Endpoint: /v1/*
 */
export const LISTRAK_API_VERSION = 'v1'

/** LIVELIKE_CLOUD_API_VERSION
 * Used by: livelike-cloud
 * Endpoint: /v1/*
 */
export const LIVELIKE_CLOUD_API_VERSION = 'v1'

/** LOOPS_API_VERSION
 * Used by: loops
 * Endpoint: /v1/*
 */
export const LOOPS_API_VERSION = 'v1'

/** MAGELLAN_AI_DELETE_API_VERSION
 * Used by: magellan-ai
 * Endpoint: /v2/*
 */
export const MAGELLAN_AI_DELETE_API_VERSION = 'v2'

/** MANTLE_API_VERSION
 * Used by: mantle
 * Endpoint: /v1/*
 */
export const MANTLE_API_VERSION = 'v1'

/** MARKETO_STATIC_LISTS_API_VERSION
 * Used by: marketo-static-lists
 * Endpoint: /rest/v1/*
 */
export const MARKETO_STATIC_LISTS_API_VERSION = 'v1'

/** METRONOME_API_VERSION
 * Used by: metronome
 * Endpoint: /v1/*
 */
export const METRONOME_API_VERSION = 'v1'

/** MOENGAGE_API_VERSION
 * Used by: moengage
 * Endpoint: /v1/*
 */
export const MOENGAGE_API_VERSION = 'v1'

/** MS_BING_ADS_AUDIENCES_API_VERSION
 * Used by: ms-bing-ads-audiences
 * Endpoint: /v13/*
 */
export const MS_BING_ADS_AUDIENCES_API_VERSION = 'v13'

/** MS_BING_ADS_AUDIENCES_OAUTH_API_VERSION
 * Used by: ms-bing-ads-audiences (OAuth)
 * Endpoint: /v2.0/token
 */
export const MS_BING_ADS_AUDIENCES_OAUTH_API_VERSION = 'v2.0'

/** MS_BING_CAPI_API_VERSION
 * Used by: ms-bing-capi
 * Endpoint: /v1/*
 */
export const MS_BING_CAPI_API_VERSION = 'v1'

/** NEXTDOOR_CAPI_API_VERSION
 * Used by: nextdoor-capi
 * Endpoint: /v2/api/conversion
 */
export const NEXTDOOR_CAPI_API_VERSION = 'v2'

/** OPTIMIZELY_FEATURE_EXPERIMENTATION_DELETE_API_VERSION
 * Used by: optimizely-feature-experimentation-actions (GDPR delete)
 * Endpoint: /v2/gdpr/*
 */
export const OPTIMIZELY_FEATURE_EXPERIMENTATION_DELETE_API_VERSION = 'v2'

/** OPTIMIZELY_FEATURE_EXPERIMENTATION_TRACK_API_VERSION
 * Used by: optimizely-feature-experimentation-actions (track events)
 * Endpoint: /v1/events
 */
export const OPTIMIZELY_FEATURE_EXPERIMENTATION_TRACK_API_VERSION = 'v1'

/** OPTIMIZELY_WEB_EVENTS_API_VERSION
 * Used by: optimizely-web (events)
 * Endpoint: /v1/events
 */
export const OPTIMIZELY_WEB_EVENTS_API_VERSION = 'v1'

/** OPTIMIZELY_WEB_CUSTOM_EVENTS_API_VERSION
 * Used by: optimizely-web (custom events)
 * Endpoint: /v2/events
 */
export const OPTIMIZELY_WEB_CUSTOM_EVENTS_API_VERSION = 'v2'

/** ONEPLUSX_API_VERSION
 * Used by: 1plusx-asset-api
 * Endpoint: /v2/*
 */
export const ONEPLUSX_API_VERSION = 'v2'

/** ORTTO_API_VERSION
 * Used by: ortto
 * Endpoint: /v1/*
 */
export const ORTTO_API_VERSION = 'v1'

/** ORTTO_AUDIENCES_API_VERSION
 * Used by: ortto-audiences
 * Endpoint: /v1/*
 */
export const ORTTO_AUDIENCES_API_VERSION = 'v1'

/** OUTFUNNEL_API_VERSION
 * Used by: outfunnel
 * Endpoint: /v1/user
 */
export const OUTFUNNEL_API_VERSION = 'v1'

/** PINTEREST_CONVERSIONS_API_VERSION
 * Used by: pinterest-conversions
 * Endpoint: /v5/ad_accounts/{ad_account_id}/events
 */
export const PINTEREST_CONVERSIONS_API_VERSION = 'v5'

/** PIPEDRIVE_API_VERSION
 * Used by: pipedrive
 * Endpoint: /v1/*
 */
export const PIPEDRIVE_API_VERSION = 'v1'

/** POSTHOG_API_VERSION
 * Used by: posthog
 * Endpoint: /v0/*
 */
export const POSTHOG_API_VERSION = 'v0'

/** POSTSCRIPT_API_VERSION
 * Used by: postscript
 * Endpoint: /v2/*
 */
export const POSTSCRIPT_API_VERSION = 'v2'

/** PRODEOLOGY_API_VERSION
 * Used by: prodeology
 * Endpoint: /v1/*
 */
export const PRODEOLOGY_API_VERSION = 'v1'

/** PUSHWOOSH_API_VERSION
 * Used by: pushwoosh
 * Endpoint: /v1/*
 */
export const PUSHWOOSH_API_VERSION = 'v1'

/** QUALTRICS_API_VERSION
 * Used by: qualtrics
 * Endpoint: /v3/*
 */
export const QUALTRICS_API_VERSION = 'v3'

/** REDDIT_AUDIENCES_AUTH_API_VERSION
 * Used by: reddit-audiences (auth)
 * Endpoint: /api/v1/access_token
 */
export const REDDIT_AUDIENCES_AUTH_API_VERSION = 'v1'

/** REDDIT_AUDIENCES_ADS_API_VERSION
 * Used by: reddit-audiences (ads)
 * Endpoint: /api/v3/*
 */
export const REDDIT_AUDIENCES_ADS_API_VERSION = 'v3'

/** REDDIT_CONVERSIONS_API_VERSION
 * Used by: reddit-conversions-api
 * Endpoint: /api/v2.0/conversions/events/{account_id}
 */
export const REDDIT_CONVERSIONS_API_VERSION = 'v2.0'

/** RESPONSYS_ASYNC_API_VERSION
 * Used by: responsys
 * Endpoint: /rest/api/v1.3/*
 */
export const RESPONSYS_ASYNC_API_VERSION = 'v1.3'

/** REVEND_API_VERSION
 * Used by: revend
 * Endpoint: /v2/*
 */
export const REVEND_API_VERSION = 'v2'

/** ROADWAYAI_API_VERSION
 * Used by: roadwayai
 * Endpoint: /v1/*
 */
export const ROADWAYAI_API_VERSION = 'v1'

/** ROKT_API_VERSION
 * Used by: rokt-audiences
 * Endpoint: /v3/*
 */
export const ROKT_API_VERSION = 'v3'

/** SALESFORCE_API_VERSION
 * Used by: salesforce
 * Endpoint: /services/data/v53.0/*
 */
export const SALESFORCE_API_VERSION = 'v53.0'

/** SALESFORCE_MARKETING_CLOUD_AUTH_API_VERSION
 * Used by: salesforce-marketing-cloud (auth)
 * Endpoint: /v2/token
 */
export const SALESFORCE_MARKETING_CLOUD_AUTH_API_VERSION = 'v2'

/** SALESFORCE_MARKETING_CLOUD_DATA_API_VERSION
 * Used by: salesforce-marketing-cloud (data)
 * Endpoint: /data/v1/*
 */
export const SALESFORCE_MARKETING_CLOUD_DATA_API_VERSION = 'v1'

/** SALESFORCE_MARKETING_CLOUD_HUB_API_VERSION
 * Used by: salesforce-marketing-cloud (hub)
 * Endpoint: /hub/v1/*
 */
export const SALESFORCE_MARKETING_CLOUD_HUB_API_VERSION = 'v1'

/** SEGMENT_PROFILES_API_VERSION
 * Used by: segment-profiles
 * Endpoint: /v1/spaces/{space_id}/collections/users/profiles/*
 */
export const SEGMENT_PROFILES_API_VERSION = 'v1'

/** SENDGRID_API_VERSION
 * Used by: sendgrid
 * Endpoint: /v3/*
 */
export const SENDGRID_API_VERSION = 'v3'

/** SENDGRID_AUDIENCES_API_VERSION
 * Used by: sendgrid-audiences
 * Endpoint: /v3/*
 */
export const SENDGRID_AUDIENCES_API_VERSION = 'v3'

/** SINGLESTORE_API_VERSION
 * Used by: singlestore
 * Endpoint: /api/v2/*
 */
export const SINGLESTORE_API_VERSION = 'v2'

/** SNAP_AUDIENCES_API_VERSION
 * Used by: snap-audiences
 * Endpoint: /v1/*
 */
export const SNAP_AUDIENCES_API_VERSION = 'v1'

/** SNAP_CONVERSIONS_API_VERSION
 * Used by: snap-conversions-api
 * Endpoint: /v3/conversions/capi/*
 */
export const SNAP_CONVERSIONS_API_VERSION = 'v3'

/** SPIFFY_API_VERSION
 * Used by: spiffy
 * Endpoint: /v1/*
 */
export const SPIFFY_API_VERSION = 'v1'

/** SPRIG_API_VERSION
 * Used by: sprig
 * Endpoint: /v2/*
 */
export const SPRIG_API_VERSION = 'v2'

/** SURVEYSPARROW_API_VERSION
 * Used by: surveysparrow
 * Endpoint: /v3/*
 */
export const SURVEYSPARROW_API_VERSION = 'v3'

/** TABOOLA_API_VERSION
 * Used by: taboola-actions
 * Endpoint: /1.0/backstage/api/*
 */
export const TABOOLA_API_VERSION = '1.0'

/** TALON_ONE_API_VERSION
 * Used by: talon-one
 * Endpoint: /v2/*
 */
export const TALON_ONE_API_VERSION = 'v2'

/** THE_TRADE_DESK_CRM_API_VERSION
 * Used by: the-trade-desk-crm
 * Endpoint: /v3/data/*
 */
export const THE_TRADE_DESK_CRM_API_VERSION = 'v3'

/** TIKTOK_APP_EVENTS_API_VERSION
 * Used by: tiktok-app-events
 * Endpoint: /open_api/v1.3/event/track/
 */
export const TIKTOK_APP_EVENTS_API_VERSION = 'v1.3'

/** TIKTOK_AUDIENCES_API_VERSION
 * Used by: tiktok-audiences
 * Endpoint: /open_api/v1.3/dmp/custom_audience/*
 */
export const TIKTOK_AUDIENCES_API_VERSION = 'v1.3'

/** TIKTOK_CONVERSIONS_API_VERSION
 * Used by: tiktok-conversions
 * Endpoint: /open_api/v1.3/event/track/
 */
export const TIKTOK_CONVERSIONS_API_VERSION = 'v1.3'

/** TIKTOK_CONVERSIONS_SANDBOX_API_VERSION
 * Used by: tiktok-conversions-sandbox
 * Endpoint: /open_api/v1.3/event/track/
 */
export const TIKTOK_CONVERSIONS_SANDBOX_API_VERSION = 'v1.3'

/** TIKTOK_OFFLINE_CONVERSIONS_API_VERSION
 * Used by: tiktok-offline-conversions
 * Endpoint: /open_api/v1.3/event/track/
 */
export const TIKTOK_OFFLINE_CONVERSIONS_API_VERSION = 'v1.3'

/** TIKTOK_OFFLINE_CONVERSIONS_SANDBOX_API_VERSION
 * Used by: tiktok-offline-conversions-sandbox
 * Endpoint: /open_api/v1.3/event/track/
 */
export const TIKTOK_OFFLINE_CONVERSIONS_SANDBOX_API_VERSION = 'v1.3'

/** TOPLYNE_API_VERSION
 * Used by: toplyne
 * Endpoint: /v1/*
 */
export const TOPLYNE_API_VERSION = 'v1'

/** TOPSORT_API_VERSION
 * Used by: topsort
 * Endpoint: /v2/*
 */
export const TOPSORT_API_VERSION = 'v2'

/** TWILIO_API_VERSION
 * Used by: twilio
 * Endpoint: /2010-04-01/*
 */
export const TWILIO_API_VERSION = '2010-04-01'

/** TWILIO_MESSAGING_API_VERSION
 * Used by: twilio-messaging (messages)
 * Endpoint: /2010-04-01/Accounts/{AccountSid}/Messages.json
 */
export const TWILIO_MESSAGING_API_VERSION = '2010-04-01'

/** TWILIO_MESSAGING_SERVICES_API_VERSION
 * Used by: twilio-messaging (services)
 * Endpoint: /v1/Services/*
 */
export const TWILIO_MESSAGING_SERVICES_API_VERSION = 'v1'

/** TWILIO_CONTENT_API_VERSION
 * Used by: twilio-messaging (content API)
 * Endpoint: /v1/Content/*
 */
export const TWILIO_CONTENT_API_VERSION = 'v1'

/** TWILIO_STUDIO_API_VERSION
 * Used by: twilio-studio
 * Endpoint: /v2/Flows/*
 */
export const TWILIO_STUDIO_API_VERSION = 'v2'

/** USERMAVEN_API_VERSION
 * Used by: usermaven
 * Endpoint: /v1/*
 */
export const USERMAVEN_API_VERSION = 'v1'

/** USERMOTION_API_VERSION
 * Used by: usermotion
 * Endpoint: /v1/*
 */
export const USERMOTION_API_VERSION = 'v1'

/** USERPILOT_API_VERSION
 * Used by: userpilot
 * Endpoint: /v1/*
 */
export const USERPILOT_API_VERSION = 'v1'

/** VIBE_AUDIENCE_API_VERSION
 * Used by: vibe-audience
 * Endpoint: /v1/*
 */
export const VIBE_AUDIENCE_API_VERSION = 'v1'

/** VOYAGE_API_VERSION
 * Used by: voyage
 * Endpoint: /v1/*
 */
export const VOYAGE_API_VERSION = 'v1'

/** YAHOO_AUDIENCES_OAUTH_VERSION
 * Used by: yahoo-audiences (OAuth 1.0a)
 * Endpoint: OAuth 1.0a signature
 */
export const YAHOO_AUDIENCES_OAUTH_VERSION = '1.0'

/** YAHOO_AUDIENCES_TAXONOMY_API_VERSION
 * Used by: yahoo-audiences (taxonomy)
 * Endpoint: /v1/taxonomy/*
 */
export const YAHOO_AUDIENCES_TAXONOMY_API_VERSION = 'v1'

/** YOTPO_API_VERSION
 * Used by: yotpo
 * Endpoint: /v2/*
 */
export const YOTPO_API_VERSION = 'v2'
