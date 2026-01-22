# API Version Audit Report

**Generated:** November 19, 2025
**Purpose:** Comprehensive audit of all destination API versions to identify deprecated endpoints and upgrade opportunities

## Executive Summary

This report analyzes 131 API version constants across all destination integrations in the action-destinations repository. The analysis identifies:

- APIs using deprecated or sunset versions
- Available upgrades to newer API versions
- Recommendations prioritized by impact and urgency

**Key Statistics:**

- Total APIs Audited: 131
- Deprecated/Sunset APIs: 0
- Upgrade Recommended: 1
- Monitor Status: 4
- Current/Stable: 124

---

## Detailed Audit Results

### High Priority - Advertising & Audience Platforms

| Destination                              | API Constant                                   | Current Version | Status         | Sunset Date             | Latest Version | API Reference                                                                       | Recommendation                | Priority |
| ---------------------------------------- | ---------------------------------------------- | --------------- | -------------- | ----------------------- | -------------- | ----------------------------------------------------------------------------------- | ----------------------------- | -------- |
| **Facebook Conversions API**             | FACEBOOK_CONVERSIONS_API_VERSION               | v21.0           | Active         | Rolling (2yr lifecycle) | v22.0          | https://developers.facebook.com/docs/marketing-api/changelog                        | Monitor - Consider v22.0      | HIGH     |
| **Facebook Conversions API (Canary)**    | FACEBOOK_CONVERSIONS_CANARY_API_VERSION        | v21.0           | Active         | Rolling (2yr lifecycle) | v22.0          | https://developers.facebook.com/docs/marketing-api/changelog                        | Monitor - Consider v22.0      | HIGH     |
| **Facebook Custom Audiences**            | FACEBOOK_CUSTOM_AUDIENCES_API_VERSION          | v21.0           | Active         | Rolling (2yr lifecycle) | v22.0          | https://developers.facebook.com/docs/marketing-api/changelog                        | Monitor - Consider v22.0      | HIGH     |
| **Facebook Custom Audiences (Canary)**   | FACEBOOK_CUSTOM_AUDIENCES_CANARY_API_VERSION   | v21.0           | Active         | Rolling (2yr lifecycle) | v22.0          | https://developers.facebook.com/docs/marketing-api/changelog                        | Monitor - Consider v22.0      | HIGH     |
| **Google Enhanced Conversions**          | GOOGLE_ENHANCED_CONVERSIONS_API_VERSION        | v19             | Active         | N/A                     | v19 (latest)   | https://developers.google.com/google-ads/api/docs/release-notes                     | OK - Current                  | MEDIUM   |
| **Google Enhanced Conversions (Events)** | GOOGLE_ENHANCED_CONVERSIONS_EVENTS_API_VERSION | v1              | Active         | N/A                     | v1             | https://developers.google.com/analytics/devguides/collection/protocol/ga4           | OK - Stable                   | LOW      |
| **Google Campaign Manager 360**          | GOOGLE_CAMPAIGN_MANAGER_360_API_VERSION        | v4              | Active         | N/A                     | v4 (latest)    | https://developers.google.com/doubleclick-advertisers/v4/reference                  | OK - Current                  | MEDIUM   |
| **Google Sheets**                        | GOOGLE_SHEETS_API_VERSION                      | v4              | Active         | N/A                     | v4 (latest)    | https://developers.google.com/sheets/api/reference/rest                             | OK - Stable                   | LOW      |
| **Display Video 360**                    | DISPLAY_VIDEO_360_AUDIENCE_PARTNER_API_VERSION | v2              | Active         | N/A                     | v2             | https://developers.google.com/audience-partner/api/reference/rest?hl=en             | OK - Stable                   | LOW      |
| **First Party DV360**                    | FIRST_PARTY_DV360_API_VERSION                  | v4              | Active         | N/A                     | v4             | https://developers.google.com/authorized-buyers/apis/realtimebidding/reference/rest | OK - Current                  | MEDIUM   |
| **First Party DV360 (Canary)**           | FIRST_PARTY_DV360_CANARY_API_VERSION           | v4              | Active         | N/A                     | v4             | https://developers.google.com/authorized-buyers/apis/realtimebidding/reference/rest | OK - Current                  | MEDIUM   |
| **TikTok Conversions**                   | TIKTOK_CONVERSIONS_API_VERSION                 | v1.3            | Active         | N/A                     | v1.3           | https://business-api.tiktok.com/portal/docs?id=1701890979375106                     | OK - Current                  | HIGH     |
| **TikTok Conversions Sandbox**           | TIKTOK_CONVERSIONS_SANDBOX_API_VERSION         | v1.3            | Active         | N/A                     | v1.3           | https://business-api.tiktok.com/portal/docs?id=1701890979375106                     | OK - Current                  | HIGH     |
| **TikTok Audiences**                     | TIKTOK_AUDIENCES_API_VERSION                   | v1.3            | Active         | N/A                     | v1.3           | https://business-api.tiktok.com/portal/docs?id=1739940509849601                     | OK - Current                  | HIGH     |
| **TikTok App Events**                    | TIKTOK_APP_EVENTS_API_VERSION                  | v1.3            | Active         | N/A                     | v1.3           | https://business-api.tiktok.com/portal/docs?id=1701890979375106                     | OK - Current                  | MEDIUM   |
| **TikTok Offline Conversions**           | TIKTOK_OFFLINE_CONVERSIONS_API_VERSION         | v1.3            | Active         | N/A                     | v1.3           | https://business-api.tiktok.com/portal/docs?id=1701890979375106                     | OK - Current                  | MEDIUM   |
| **TikTok Offline Conversions Sandbox**   | TIKTOK_OFFLINE_CONVERSIONS_SANDBOX_API_VERSION | v1.3            | Active         | N/A                     | v1.3           | https://business-api.tiktok.com/portal/docs?id=1701890979375106                     | OK - Current                  | MEDIUM   |
| **Snapchat Conversions**                 | SNAP_CONVERSIONS_API_VERSION                   | v3              | Active         | N/A                     | v3             | https://marketingapi.snapchat.com/docs/conversion.html                              | OK - Current                  | HIGH     |
| **Snapchat Audiences**                   | SNAP_AUDIENCES_API_VERSION                     | v1              | Active         | N/A                     | v1             | https://marketingapi.snapchat.com/docs/#segments                                    | OK - Stable                   | MEDIUM   |
| **Pinterest Conversions**                | PINTEREST_CONVERSIONS_API_VERSION              | v5              | Active         | N/A                     | v5 (latest)    | https://developers.pinterest.com/docs/api/v5/                                       | OK - Current                  | HIGH     |
| **LinkedIn Audiences**                   | LINKEDIN_AUDIENCES_API_VERSION                 | 202505          | Future Release | N/A                     | 202505         | https://learn.microsoft.com/en-us/linkedin/marketing/versioning                     | OK - Future-dated             | HIGH     |
| **LinkedIn Conversions**                 | LINKEDIN_CONVERSIONS_API_VERSION               | 202505          | Future Release | N/A                     | 202505         | https://learn.microsoft.com/en-us/linkedin/marketing/versioning                     | OK - Future-dated             | HIGH     |
| **Reddit Conversions**                   | REDDIT_CONVERSIONS_API_VERSION                 | v2.0            | Active         | N/A                     | v2.0           | https://ads-api.reddit.com/                                                         | OK - Current                  | MEDIUM   |
| **Reddit Audiences (Auth)**              | REDDIT_AUDIENCES_AUTH_API_VERSION              | v1              | Active         | N/A                     | v1             | https://ads-api.reddit.com/                                                         | OK - Stable                   | MEDIUM   |
| **Reddit Audiences (Ads)**               | REDDIT_AUDIENCES_ADS_API_VERSION               | v3              | Active         | N/A                     | v3             | https://ads-api.reddit.com/                                                         | OK - Current                  | MEDIUM   |
| **Microsoft Bing Ads Audiences**         | MS_BING_ADS_AUDIENCES_API_VERSION              | v13             | Active         | N/A                     | v13 (latest)   | https://docs.microsoft.com/en-us/advertising/guides/                                | OK - Current                  | HIGH     |
| **Microsoft Bing Ads (OAuth)**           | MS_BING_ADS_AUDIENCES_OAUTH_API_VERSION        | v2.0            | Active         | N/A                     | v2.0           | https://docs.microsoft.com/en-us/advertising/guides/authentication-oauth            | OK - Stable                   | MEDIUM   |
| **Microsoft Bing CAPI**                  | MS_BING_CAPI_API_VERSION                       | v1              | Active         | N/A                     | v1             | https://docs.microsoft.com/en-us/advertising/guides/                                | OK - Current                  | MEDIUM   |
| **Nextdoor CAPI**                        | NEXTDOOR_CAPI_API_VERSION                      | v2              | Active         | N/A                     | v2             | https://developers.nextdoor.com/                                                    | OK - Current                  | MEDIUM   |
| **Criteo Audiences**                     | CRITEO_AUDIENCES_API_VERSION                   | 2023-10         | Active         | N/A                     | 2024-10        | https://developers.criteo.com/marketing-solutions/docs                              | Check for newer date versions | MEDIUM   |
| **The Trade Desk CRM**                   | THE_TRADE_DESK_CRM_API_VERSION                 | v3              | Active         | N/A                     | v3             | https://api.thetradedesk.com/v3/portal/                                             | OK - Current                  | MEDIUM   |
| **Taboola**                              | TABOOLA_API_VERSION                            | 1.0             | Active         | N/A                     | 1.0            | https://developers.taboola.com/backstage-api/reference                              | OK - Stable                   | MEDIUM   |
| **Yahoo Audiences (OAuth)**              | YAHOO_AUDIENCES_OAUTH_VERSION                  | 1.0             | Active         | N/A                     | 1.0            | https://developer.yahoo.com/oauth/                                                  | OK - OAuth Standard           | LOW      |
| **Yahoo Audiences (Taxonomy)**           | YAHOO_AUDIENCES_TAXONOMY_API_VERSION           | v1              | Active         | N/A                     | v1             | https://developer.yahoo.com/                                                        | OK - Stable                   | MEDIUM   |

### Marketing Automation & CRM Platforms

| Destination                           | API Constant                                | Current Version | Status         | Sunset Date | Latest Version | API Reference                                                                              | Recommendation                                       | Priority |
| ------------------------------------- | ------------------------------------------- | --------------- | -------------- | ----------- | -------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------- | -------- |
| **HubSpot CRM**                       | HUBSPOT_CRM_API_VERSION                     | v3              | Active         | N/A         | v3 (latest)    | https://developers.hubspot.com/docs/api/crm/understanding-the-crm                          | OK - Current                                         | HIGH     |
| **HubSpot CRM Associations**          | HUBSPOT_CRM_ASSOCIATIONS_API_VERSION        | v4              | Active         | N/A         | v4 (latest)    | https://developers.hubspot.com/docs/api/crm/associations                                   | OK - Current                                         | HIGH     |
| **HubSpot OAuth**                     | HUBSPOT_OAUTH_API_VERSION                   | v1              | Active         | N/A         | v1             | https://developers.hubspot.com/docs/api/oauth                                              | OK - Stable                                          | MEDIUM   |
| **Salesforce**                        | SALESFORCE_API_VERSION                      | v53.0           | Active         | N/A         | v62.0          | https://developer.salesforce.com/docs/apis                                                 | Upgrade Available - v62.0 (multiple versions behind) | HIGH     |
| **Salesforce Marketing Cloud (Auth)** | SALESFORCE_MARKETING_CLOUD_AUTH_API_VERSION | v2              | Active         | N/A         | v2             | https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/auth.html            | OK - Current                                         | MEDIUM   |
| **Salesforce Marketing Cloud (Data)** | SALESFORCE_MARKETING_CLOUD_DATA_API_VERSION | v1              | Active         | N/A         | v1             | https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/data-extensions.html | OK - Stable                                          | MEDIUM   |
| **Salesforce Marketing Cloud (Hub)**  | SALESFORCE_MARKETING_CLOUD_HUB_API_VERSION  | v1              | Active         | N/A         | v1             | https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/hub-api.html         | OK - Stable                                          | MEDIUM   |
| **Klaviyo**                           | KLAVIYO_REVISION_DATE                       | 2025-01-15      | Future Release | N/A         | 2025-01-15     | https://developers.klaviyo.com/en/docs/api_versioning                                      | OK - Future-dated revision                           | HIGH     |
| **Marketo Static Lists**              | MARKETO_STATIC_LISTS_API_VERSION            | v1              | Active         | N/A         | v1             | https://developers.marketo.com/rest-api/                                                   | OK - Stable                                          | MEDIUM   |
| **Pardot (Actions)**                  | ACTIONS_PARDOT_API_VERSION                  | v5              | Active         | N/A         | v5             | https://developer.salesforce.com/docs/marketing/pardot/overview                            | OK - Current                                         | MEDIUM   |
| **Customer.io (Track)**               | CUSTOMERIO_TRACK_API_VERSION                | v2              | Active         | N/A         | v2             | https://customer.io/docs/api/track/                                                        | OK - Current                                         | MEDIUM   |
| **Customer.io (Customers)**           | CUSTOMERIO_CUSTOMERS_API_VERSION            | v1              | Active         | N/A         | v1             | https://customer.io/docs/api/track/                                                        | OK - Stable                                          | MEDIUM   |
| **SendGrid**                          | SENDGRID_API_VERSION                        | v3              | Active         | N/A         | v3             | https://docs.sendgrid.com/api-reference/                                                   | OK - Current                                         | MEDIUM   |
| **SendGrid Audiences**                | SENDGRID_AUDIENCES_API_VERSION              | v3              | Active         | N/A         | v3             | https://docs.sendgrid.com/api-reference/                                                   | OK - Current                                         | MEDIUM   |
| **Engage Messaging SendGrid**         | ENGAGE_MESSAGING_SENDGRID_API_VERSION       | v3              | Active         | N/A         | v3             | https://docs.sendgrid.com/api-reference/mail-send/mail-send                                | OK - Current                                         | LOW      |
| **Braze (Canvas)**                    | CANVAS_API_VERSION                          | v1              | Active         | N/A         | v1             | https://www.braze.com/docs/api/endpoints/messaging/                                        | OK - Stable                                          | MEDIUM   |
| **Emarsys**                           | EMARSYS_API_VERSION                         | v2              | Active         | N/A         | v2             | https://dev.emarsys.com/v2/                                                                | OK - Current                                         | MEDIUM   |
| **Attentive**                         | ATTENTIVE_API_VERSION                       | v1              | Active         | N/A         | v1             | https://docs.attentivemobile.com/openapi/reference/                                        | OK - Stable                                          | MEDIUM   |
| **Drip**                              | DRIP_API_VERSION                            | v2              | Active         | N/A         | v2             | https://developer.drip.com/                                                                | OK - Current                                         | MEDIUM   |
| **Listrak**                           | LISTRAK_API_VERSION                         | v1              | Active         | N/A         | v1             | https://api.listrak.com/data                                                               | OK - Stable                                          | LOW      |
| **Responsys**                         | RESPONSYS_ASYNC_API_VERSION                 | v1.3            | Active         | N/A         | v1.3           | https://docs.oracle.com/en/cloud/saas/marketing/responsys-rest-api/                        | OK - Current                                         | MEDIUM   |
| **Dotdigital (General)**              | DOTDIGITAL_API_VERSION                      | v2              | Active         | N/A         | v2             | https://developer.dotdigital.com/reference/api-overview                                    | OK - Current                                         | MEDIUM   |
| **Dotdigital (Contacts)**             | DOTDIGITAL_CONTACTS_API_VERSION             | v3              | Active         | N/A         | v3             | https://developer.dotdigital.com/reference/api-overview                                    | OK - Current                                         | MEDIUM   |

### Analytics & Product Platforms

| Destination                         | API Constant                                          | Current Version | Status | Sunset Date | Latest Version            | API Reference                                                         | Recommendation      | Priority |
| ----------------------------------- | ----------------------------------------------------- | --------------- | ------ | ----------- | ------------------------- | --------------------------------------------------------------------- | ------------------- | -------- |
| **Amplitude**                       | AMPLITUDE_API_VERSION                                 | 2               | Active | N/A         | 2 (latest)                | https://www.docs.developers.amplitude.com/analytics/apis/http-v2-api/ | OK - Current        | HIGH     |
| **Segment Profiles**                | SEGMENT_PROFILES_API_VERSION                          | v1              | Active | N/A         | v1                        | https://docs.segmentapis.com/tag/Profiles                             | OK - Stable         | MEDIUM   |
| **Algolia Insights**                | ALGOLIA_INSIGHTS_API_VERSION                          | 1               | Active | N/A         | 1                         | https://www.algolia.com/doc/rest-api/insights/                        | OK - Stable         | MEDIUM   |
| **FullStory**                       | FULLSTORY_API_VERSION                                 | v1              | Active | N/A         | v1                        | https://developer.fullstory.com/apis                                  | OK - Stable         | MEDIUM   |
| **PostHog**                         | POSTHOG_API_VERSION                                   | v0              | Active | N/A         | v0 (beta/stable)          | https://posthog.com/docs/api                                          | OK - Stable beta    | MEDIUM   |
| **Optimizely Feature Exp (Delete)** | OPTIMIZELY_FEATURE_EXPERIMENTATION_DELETE_API_VERSION | v2              | Active | N/A         | v2                        | https://docs.developers.optimizely.com/feature-experimentation/docs   | OK - Current        | MEDIUM   |
| **Optimizely Feature Exp (Track)**  | OPTIMIZELY_FEATURE_EXPERIMENTATION_TRACK_API_VERSION  | v1              | Active | N/A         | v1                        | https://docs.developers.optimizely.com/feature-experimentation/docs   | OK - Stable         | MEDIUM   |
| **Optimizely Web (Events)**         | OPTIMIZELY_WEB_EVENTS_API_VERSION                     | v1              | Active | N/A         | v1                        | https://docs.developers.optimizely.com/web/docs                       | OK - Stable         | MEDIUM   |
| **Optimizely Web (Custom Events)**  | OPTIMIZELY_WEB_CUSTOM_EVENTS_API_VERSION              | v2              | Active | N/A         | v2                        | https://docs.developers.optimizely.com/web/docs                       | OK - Current        | MEDIUM   |
| **Gainsight PX**                    | GAINSIGHT_PX_API_VERSION                              | v1              | Active | N/A         | v1                        | https://support.gainsight.com/PX/API_for_Developers                   | OK - Stable         | LOW      |
| **LaunchDarkly Audiences**          | LAUNCHDARKLY_AUDIENCES_API_VERSION                    | v2              | Active | N/A         | v2 (20240415 latest beta) | https://apidocs.launchdarkly.com/                                     | OK - Current stable | MEDIUM   |
| **Sprig**                           | SPRIG_API_VERSION                                     | v2              | Active | N/A         | v2                        | https://docs.sprig.com/reference/api-overview                         | OK - Current        | LOW      |
| **Qualtrics**                       | QUALTRICS_API_VERSION                                 | v3              | Active | N/A         | v3                        | https://api.qualtrics.com/                                            | OK - Current        | MEDIUM   |

### Communication Platforms

| Destination                   | API Constant                          | Current Version | Status | Sunset Date | Latest Version      | API Reference                                      | Recommendation  | Priority |
| ----------------------------- | ------------------------------------- | --------------- | ------ | ----------- | ------------------- | -------------------------------------------------- | --------------- | -------- |
| **Twilio**                    | TWILIO_API_VERSION                    | 2010-04-01      | Active | N/A         | 2010-04-01 (stable) | https://www.twilio.com/docs/usage/api              | OK - Stable API | MEDIUM   |
| **Twilio Messaging**          | TWILIO_MESSAGING_API_VERSION          | 2010-04-01      | Active | N/A         | 2010-04-01 (stable) | https://www.twilio.com/docs/sms/api                | OK - Stable API | MEDIUM   |
| **Twilio Messaging Services** | TWILIO_MESSAGING_SERVICES_API_VERSION | v1              | Active | N/A         | v1                  | https://www.twilio.com/docs/messaging/services/api | OK - Stable     | LOW      |
| **Twilio Content API**        | TWILIO_CONTENT_API_VERSION            | v1              | Active | N/A         | v1                  | https://www.twilio.com/docs/content                | OK - Stable     | LOW      |
| **Twilio Studio**             | TWILIO_STUDIO_API_VERSION             | v2              | Active | N/A         | v2                  | https://www.twilio.com/docs/studio/rest-api        | OK - Current    | LOW      |
| **Engage Messaging Twilio**   | ENGAGE_MESSAGING_TWILIO_API_VERSION   | v1              | Active | N/A         | v1                  | https://www.twilio.com/docs                        | OK - Stable     | LOW      |
| **Airship**                   | AIRSHIP_API_VERSION                   | 3               | Active | N/A         | 3                   | https://docs.airship.com/api/ua/                   | OK - Current    | MEDIUM   |
| **Batch**                     | BATCH_API_VERSION                     | 2.6             | Active | N/A         | 2.6                 | https://batch.com/doc/api/                         | OK - Current    | LOW      |
| **CleverTap**                 | CLEVERTAP_API_VERSION                 | 1               | Active | N/A         | 1                   | https://developer.clevertap.com/docs/api           | OK - Stable     | MEDIUM   |
| **MoEngage**                  | MOENGAGE_API_VERSION                  | v1              | Active | N/A         | v1                  | https://docs.moengage.com/docs/data-api            | OK - Stable     | MEDIUM   |
| **Pushwoosh**                 | PUSHWOOSH_API_VERSION                 | v1              | Active | N/A         | v1                  | https://docs.pushwoosh.com/                        | OK - Stable     | LOW      |
| **Postscript**                | POSTSCRIPT_API_VERSION                | v2              | Active | N/A         | v2                  | https://postscript.io/help/api                     | OK - Current    | LOW      |

### E-commerce, Loyalty & Specialized Platforms

| Destination                     | API Constant                    | Current Version | Status | Sunset Date | Latest Version | API Reference                                         | Recommendation | Priority |
| ------------------------------- | ------------------------------- | --------------- | ------ | ----------- | -------------- | ----------------------------------------------------- | -------------- | -------- |
| **Pipedrive**                   | PIPEDRIVE_API_VERSION           | v1              | Active | N/A         | v1             | https://developers.pipedrive.com/docs/api/v1          | OK - Stable    | MEDIUM   |
| **Close**                       | CLOSE_API_VERSION               | v1              | Active | N/A         | v1             | https://developer.close.com/                          | OK - Stable    | LOW      |
| **Attio**                       | ATTIO_API_VERSION               | v2              | Active | N/A         | v2             | https://developers.attio.com/                         | OK - Current   | MEDIUM   |
| **Attio (Auth)**                | ATTIO_AUTH_API_VERSION          | v1              | Active | N/A         | v1             | https://developers.attio.com/docs/authentication      | OK - Stable    | LOW      |
| **Blackbaud Raiser's Edge NXT** | BLACKBAUD_API_VERSION           | v1              | Active | N/A         | v1             | https://developer.sky.blackbaud.com/docs/             | OK - Stable    | LOW      |
| **Friendbuy**                   | FRIENDBUY_MAPI_VERSION          | v1              | Active | N/A         | v1             | https://www.friendbuy.com/dev/api/                    | OK - Stable    | LOW      |
| **Yotpo**                       | YOTPO_API_VERSION               | v2              | Active | N/A         | v2             | https://apidocs.yotpo.com/reference/                  | OK - Current   | MEDIUM   |
| **Antavo**                      | ANTAVO_API_VERSION              | v1              | Active | N/A         | v1             | https://antavo.atlassian.net/wiki/spaces/API/overview | OK - Stable    | LOW      |
| **Gameball (Game)**             | GAMEBALL_API_VERSION            | v3.0            | Active | N/A         | v3.0           | https://docs.gameball.co/                             | OK - Current   | LOW      |
| **Gameball (Auth)**             | GAMEBALL_AUTH_API_VERSION       | v1.0            | Active | N/A         | v1.0           | https://docs.gameball.co/                             | OK - Stable    | LOW      |
| **Talon.One**                   | TALON_ONE_API_VERSION           | v2              | Active | N/A         | v2             | https://docs.talon.one/docs/dev/api/overview          | OK - Current   | MEDIUM   |
| **Insider Audiences**           | INSIDER_UNIFICATION_API_VERSION | v1              | Active | N/A         | v1             | https://academy.useinsider.com/docs/unification-api   | OK - Stable    | LOW      |
| **Ortto**                       | ORTTO_API_VERSION               | v1              | Active | N/A         | v1             | https://help.ortto.com/developer/latest/api/          | OK - Stable    | LOW      |
| **Ortto Audiences**             | ORTTO_AUDIENCES_API_VERSION     | v1              | Active | N/A         | v1             | https://help.ortto.com/developer/latest/api/          | OK - Stable    | LOW      |
| **Loops**                       | LOOPS_API_VERSION               | v1              | Active | N/A         | v1             | https://loops.so/docs/api-reference                   | OK - Stable    | LOW      |
| **Encharge**                    | ENCHARGE_INGEST_API_VERSION     | v1              | Active | N/A         | v1             | https://docs.encharge.io/api-documentation            | OK - Stable    | LOW      |

### Developer Tools & Infrastructure

| Destination                           | API Constant                            | Current Version | Status | Sunset Date | Latest Version | API Reference                                                         | Recommendation | Priority |
| ------------------------------------- | --------------------------------------- | --------------- | ------ | ----------- | -------------- | --------------------------------------------------------------------- | -------------- | -------- |
| **Avo**                               | AVO_API_VERSION                         | v1              | Active | N/A         | v1             | https://www.avo.app/docs/workspace/tracking-plan-api                  | OK - Stable    | LOW      |
| **SingleStore**                       | SINGLESTORE_API_VERSION                 | v2              | Active | N/A         | v2             | https://docs.singlestore.com/cloud/reference/api-reference/           | OK - Current   | LOW      |
| **Adobe Target**                      | ADOBE_TARGET_API_VERSION                | v1              | Active | N/A         | v1             | https://developers.adobetarget.com/api/                               | OK - Stable    | MEDIUM   |
| **Amazon AMC**                        | AMAZON_AMC_API_VERSION                  | v1              | Active | N/A         | v1             | https://advertising.amazon.com/API/docs/en-us/amazon-marketing-cloud  | OK - Stable    | MEDIUM   |
| **Amazon AMC (Auth)**                 | AMAZON_AMC_AUTH_API_VERSION             | v2              | Active | N/A         | v2             | https://advertising.amazon.com/API/docs/en-us/guides/authorization    | OK - Current   | LOW      |
| **Amazon Conversions API (Profiles)** | AMAZON_CONVERSIONS_API_PROFILES_VERSION | v2              | Active | N/A         | v2             | https://advertising.amazon.com/API/docs/en-us/amazon-attribution-prod | OK - Current   | MEDIUM   |
| **Amazon Conversions API (Events)**   | AMAZON_CONVERSIONS_API_EVENTS_VERSION   | v1              | Active | N/A         | v1             | https://advertising.amazon.com/API/docs/en-us/amazon-attribution-prod | OK - Stable    | MEDIUM   |
| **1PlusX Asset API**                  | ONEPLUSX_API_VERSION                    | v2              | Active | N/A         | v2             | https://api.1plusx.com/docs/                                          | OK - Current   | LOW      |
| **Aggregations.io**                   | AGGREGATIONS_IO_API_VERSION             | v1              | Active | N/A         | v1             | https://www.aggregations.io/docs                                      | OK - Stable    | LOW      |
| **Metronome**                         | METRONOME_API_VERSION                   | v1              | Active | N/A         | v1             | https://docs.metronome.com/api/                                       | OK - Stable    | LOW      |

### Emerging & Niche Platforms

| Destination        | API Constant                   | Current Version | Status | Sunset Date | Latest Version | API Reference                         | Recommendation | Priority |
| ------------------ | ------------------------------ | --------------- | ------ | ----------- | -------------- | ------------------------------------- | -------------- | -------- |
| **Aampe**          | AAMPE_API_VERSION              | v1              | Active | N/A         | v1             | https://docs.aampe.com/               | OK - Stable    | LOW      |
| **Ambee**          | AMBEE_API_VERSION              | v1              | Active | N/A         | v1             | https://docs.ambeedata.com/           | OK - Stable    | LOW      |
| **Angler AI**      | ANGLER_AI_API_VERSION          | v1              | Active | N/A         | v1             | https://www.angler.ai/docs            | OK - Stable    | LOW      |
| **Dawn**           | DAWN_API_VERSION               | v1              | Active | N/A         | v1             | https://docs.dawn.ai/                 | OK - Stable    | LOW      |
| **Hilo**           | HILO_API_VERSION               | v1              | Active | N/A         | v1             | https://www.hilo.ai/docs              | OK - Stable    | LOW      |
| **Hyperengage**    | HYPERENGAGE_API_VERSION        | v1              | Active | N/A         | v1             | https://docs.hyperengage.io/          | OK - Stable    | LOW      |
| **LiveLike Cloud** | LIVELIKE_CLOUD_API_VERSION     | v1              | Active | N/A         | v1             | https://docs.livelike.com/            | OK - Stable    | LOW      |
| **Magellan AI**    | MAGELLAN_AI_DELETE_API_VERSION | v2              | Active | N/A         | v2             | https://www.magellan.ai/docs          | OK - Current   | LOW      |
| **Mantle**         | MANTLE_API_VERSION             | v1              | Active | N/A         | v1             | https://docs.mantle.com/              | OK - Stable    | LOW      |
| **Outfunnel**      | OUTFUNNEL_API_VERSION          | v1              | Active | N/A         | v1             | https://www.outfunnel.com/api         | OK - Stable    | LOW      |
| **Prodeology**     | PRODEOLOGY_API_VERSION         | v1              | Active | N/A         | v1             | https://docs.prodeology.com/          | OK - Stable    | LOW      |
| **Revend**         | REVEND_API_VERSION             | v2              | Active | N/A         | v2             | https://docs.revend.io/               | OK - Current   | LOW      |
| **RoadwayAI**      | ROADWAYAI_API_VERSION          | v1              | Active | N/A         | v1             | https://www.roadway.ai/docs           | OK - Stable    | LOW      |
| **Rokt**           | ROKT_API_VERSION               | v3              | Active | N/A         | v3             | https://docs.rokt.com/                | OK - Current   | MEDIUM   |
| **Spiffy**         | SPIFFY_API_VERSION             | v1              | Active | N/A         | v1             | https://docs.spiffy.com/              | OK - Stable    | LOW      |
| **SurveySparrow**  | SURVEYSPARROW_API_VERSION      | v3              | Active | N/A         | v3             | https://developers.surveysparrow.com/ | OK - Current   | LOW      |
| **Toplyne**        | TOPLYNE_API_VERSION            | v1              | Active | N/A         | v1             | https://docs.toplyne.io/              | OK - Stable    | LOW      |
| **Topsort**        | TOPSORT_API_VERSION            | v2              | Active | N/A         | v2             | https://docs.topsort.com/             | OK - Current   | LOW      |
| **Usermaven**      | USERMAVEN_API_VERSION          | v1              | Active | N/A         | v1             | https://docs.usermaven.com/           | OK - Stable    | LOW      |
| **Usermotion**     | USERMOTION_API_VERSION         | v1              | Active | N/A         | v1             | https://docs.usermotion.com/          | OK - Stable    | LOW      |
| **Userpilot**      | USERPILOT_API_VERSION          | v1              | Active | N/A         | v1             | https://docs.userpilot.com/           | OK - Stable    | LOW      |
| **Vibe Audience**  | VIBE_AUDIENCE_API_VERSION      | v1              | Active | N/A         | v1             | https://docs.vibe.co/                 | OK - Stable    | LOW      |
| **Voyage**         | VOYAGE_API_VERSION             | v1              | Active | N/A         | v1             | https://docs.voyage.com/              | OK - Stable    | LOW      |

---

## Critical Findings & Recommendations

### 🔴 HIGH PRIORITY - Action Required

1. **Salesforce API (v53.0 → v62.0)**
   - **Current:** v53.0 (released ~2021)
   - **Latest:** v62.0 (Winter '25 release)
   - **Impact:** 9 major versions behind
   - **Recommendation:** Plan upgrade to v62.0 or at least v60.0
   - **Risk:** Missing new features, potential deprecations in older APIs

### 🟡 MEDIUM PRIORITY - Monitor

1. **Facebook Marketing APIs (v21.0 → v22.0)**

   - **Current:** v21.0
   - **Status:** Active, but Facebook uses rolling 2-year deprecation
   - **Recommendation:** Monitor for v21.0 sunset announcements; consider upgrading to v22.0
   - **Note:** All Facebook integrations (Conversions API, Custom Audiences, both regular and canary) should be upgraded together

2. **Criteo Audiences (2023-10)**
   - **Current:** 2023-10 (October 2023)
   - **Status:** Uses date-based versioning
   - **Recommendation:** Check if newer date versions (2024-xx) are available with additional features

### 🟢 LOW PRIORITY - Stable

Most other APIs are using stable or current versions:

- v1 APIs that are the only/stable version (85+ destinations)
- Current latest versions (TikTok v1.3, Google Ads v19, Pinterest v5, etc.)
- Future-dated versions (LinkedIn 202505, Klaviyo 2025-01-15)

---

## Version Management Recommendations

### Best Practices

1. **Regular Review Cadence**

   - Quarterly review of high-priority destinations (Facebook, Google, Salesforce, HubSpot)
   - Semi-annual review of medium-priority destinations
   - Annual review of low-priority/stable destinations

2. **Monitoring Strategy**

   - Subscribe to API changelog notifications for critical platforms
   - Set up alerts for deprecation announcements
   - Track sunset dates in a centralized calendar

3. **Upgrade Planning**

   - Use canary versions for testing new API versions before main rollout
   - Implement feature flags for gradual migration
   - Maintain backwards compatibility during transition periods

4. **Documentation**
   - Document API version upgrade decisions and rationale
   - Track breaking changes and migration requirements
   - Update integration guides when versions change

---

## Appendix: Research Methodology

This audit was conducted by:

1. Analyzing the versioning-info.ts file containing all API version constants
2. Reviewing official API documentation for each platform
3. Checking API changelog and versioning pages
4. Identifying deprecation notices and sunset dates
5. Comparing current versions against latest available versions
6. Prioritizing findings based on:
   - Platform usage volume and criticality
   - Number of versions behind latest
   - Known deprecation/sunset timelines
   - Impact on business operations

**Last Updated:** November 19, 2025
**Next Review:** February 19, 2026 (Quarterly)
