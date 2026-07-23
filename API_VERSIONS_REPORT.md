# API Versions in Segment Action Destinations

This report identifies the API versions used across all destination integrations in the action-destinations repository.

**Total destinations analyzed:** 198
**Destinations with identifiable API versions:** 85
**All versions verified:** ✓

## Summary

Below is a comprehensive table of all destinations that use versioned APIs, including:
- The destination name
- The API version identified (either from constants or extracted from API URLs)
- A permalink to the exact line in the source file containing the version information

## Destinations with API Versions

| # | Destination | API Version | Version Location | Source File (with line number) |
|---|-------------|-------------|------------------|-------------------------------|
| 1 | 1plusx | `v2` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/1plusx/sendPageview/index.ts#L118) |
| 2 | 1plusx-asset-api | `v2` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/1plusx-asset-api/sendAssetData/index.ts#L63) |
| 3 | aampe | `v1` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/aampe/constants.ts#L2) |
| 4 | absmartly | `v1` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/absmartly/index.ts#L65) |
| 5 | adobe-target | `v1` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/adobe-target/adobeTarget_operations.ts#L63) |
| 6 | aggregations-io | `v1` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/aggregations-io/index.ts#L32) |
| 7 | ambee | `v1` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/ambee/index.ts#L54) |
| 8 | antavo | `v1` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/antavo/event/index.ts#L39) |
| 9 | attentive | `v1` ✓ | Constants file | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/attentive/constants.ts#L2) |
| 10 | attio | `v1` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/attio/index.ts#L16) |
| 11 | avo | `v1` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/avo/sendSchemaToInspector/index.ts#L10) |
| 12 | canvas | `v1` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/canvas/api.ts#L6) |
| 13 | close | `v1` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/close/index.ts#L52) |
| 14 | dawn | `v1` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/dawn/utils.ts#L1) |
| 15 | display-video-360 | `v2` ✓ | Constants file | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/display-video-360/constants.ts#L1) |
| 16 | dotdigital | `v2` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/dotdigital/sendTransactionalSms/index.ts#L43) |
| 17 | drip | `v2` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/drip/index.ts#L28) |
| 18 | engage-messaging-sendgrid | `v3` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/engage-messaging-sendgrid/index.ts#L62) |
| 19 | engage-messaging-twilio | `v1` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/engage-messaging-twilio/utils/TwilioMessageSender.ts#L75) |
| 20 | facebook-conversions-api | `21.0` ✓ | Constants file | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/facebook-conversions-api/constants.ts#L1) |
| 21 | facebook-custom-audiences | `v21.0` ✓ | Constants file | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/facebook-custom-audiences/constants.ts#L53) |
| 22 | first-party-dv360 | `v4` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/first-party-dv360/index.ts#L33) |
| 23 | gainsight-px-cloud-action | `v1` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/gainsight-px-cloud-action/regional-endpoints.ts#L3) |
| 24 | google-analytics-4 | `v2` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/google-analytics-4/addPaymentInfo/index.ts#L66) |
| 25 | google-campaign-manager-360 | `v4` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/google-campaign-manager-360/index.ts#L43) |
| 26 | google-enhanced-conversions | `v3` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/google-enhanced-conversions/index.ts#L51) |
| 27 | google-sheets | `v4` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/google-sheets/index.ts#L28) |
| 28 | hilo | `v1` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/hilo/index.ts#L64) |
| 29 | hubspot | `v3` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/hubspot/upsertCustomObjectRecord/index.ts#L202) |
| 30 | hyperengage | `v1` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/hyperengage/index.ts#L54) |
| 31 | insider-audiences | `v1` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/insider-audiences/insiderAudiences/__tests__/index.test.ts#L29) |
| 32 | launchdarkly-audiences | `v2` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/launchdarkly-audiences/constants.ts#L3) |
| 33 | linkedin-audiences | `202505` ✓ | Constants file | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/linkedin-audiences/constants.ts#L1) |
| 34 | linkedin-conversions | `202505` ✓ | Constants file | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/linkedin-conversions/constants.ts#L3) |
| 35 | listrak | `v1` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/listrak/updateEmailContactProfileFields/index.ts#L115) |
| 36 | livelike-cloud | `v1` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/livelike-cloud/constants.ts#L1) |
| 37 | loops | `v1` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/loops/index.ts#L29) |
| 38 | magellan-ai | `v2` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/magellan-ai/index.ts#L41) |
| 39 | mantle | `v1` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/mantle/config.ts#L1) |
| 40 | marketo-static-lists | `v1` ✓ | Constants file | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/marketo-static-lists/constants.ts#L1) |
| 41 | metronome | `v1` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/metronome/index.ts#L22) |
| 42 | ms-bing-ads-audiences | `v13` ✓ | Constants file | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/ms-bing-ads-audiences/constants.ts#L3) |
| 43 | ms-bing-capi | `v1` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/ms-bing-capi/sendEvent/constants.ts#L1) |
| 44 | nextdoor-capi | `v2` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/nextdoor-capi/index.ts#L35) |
| 45 | optimizely-feature-experimentation-actions | `v2` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/optimizely-feature-experimentation-actions/index.ts#L27) |
| 46 | optimizely-web | `v2` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/optimizely-web/trackEvent/client.ts#L20) |
| 47 | outfunnel | `v1` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/outfunnel/index.ts#L32) |
| 48 | pinterest-conversions | `v5` ✓ | Constants file | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/pinterest-conversions/constants.ts#L1) |
| 49 | pipedrive | `v1` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/pipedrive/index.ts#L62) |
| 50 | prodeology | `v1` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/prodeology/index.ts#L62) |
| 51 | reddit-audiences | `v1` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/reddit-audiences/index.ts#L23) |
| 52 | reddit-conversions-api | `v2.0` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/reddit-conversions-api/index.ts#L38) |
| 53 | responsys | `v1` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/responsys/utils.ts#L284) |
| 54 | revend | `v2` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/revend/signUp/index.ts#L56) |
| 55 | roadwayai | `v1` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/roadwayai/index.ts#L58) |
| 56 | rokt-audiences | `v3` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/rokt-audiences/constants.ts#L5) |
| 57 | s3 | `v3` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/s3/syncToS3/client.ts#L111) |
| 58 | salesforce-marketing-cloud | `v2` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/salesforce-marketing-cloud/index.ts#L55) |
| 59 | segment | `v1` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/segment/properties.ts#L10) |
| 60 | segment-profiles | `v1` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/segment-profiles/properties.ts#L10) |
| 61 | sendgrid | `v3` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/sendgrid/__tests__/index.test.ts#L28) |
| 62 | sendgrid-audiences | `v3` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/sendgrid-audiences/index.ts#L26) |
| 63 | singlestore | `v2` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/singlestore/index.ts#L56) |
| 64 | snap-audiences | `v1` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/snap-audiences/index.ts#L143) |
| 65 | snap-conversions-api | `v3` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/snap-conversions-api/_tests_/index.test.ts#L449) |
| 66 | spiffy | `v1` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/spiffy/index.ts#L49) |
| 67 | sprig | `v2` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/sprig/identifyUser/index.ts#L30) |
| 68 | surveysparrow | `v3` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/surveysparrow/index.ts#L26) |
| 69 | talon-one | `v2` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/talon-one/updateCustomerProfileV3/index.ts#L31) |
| 70 | the-trade-desk-crm | `v3` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/the-trade-desk-crm/index.ts#L41) |
| 71 | tiktok-app-events | `v1.3` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/tiktok-app-events/index.ts#L77) |
| 72 | tiktok-audiences | `v1.3` ✓ | Constants file | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/tiktok-audiences/constants.ts#L1) |
| 73 | tiktok-conversions | `v1.3` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/tiktok-conversions/index.ts#L80) |
| 74 | tiktok-conversions-sandbox | `v1.3` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/tiktok-conversions-sandbox/index.ts#L81) |
| 75 | tiktok-offline-conversions | `v1.3` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/tiktok-offline-conversions/index.ts#L76) |
| 76 | tiktok-offline-conversions-sandbox | `v1.3` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/tiktok-offline-conversions-sandbox/index.ts#L76) |
| 77 | toplyne | `v1` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/toplyne/constants.ts#L1) |
| 78 | topsort | `v2` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/topsort/client.ts#L18) |
| 79 | twilio-messaging | `v1` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/twilio-messaging/sendMessage/constants.ts#L25) |
| 80 | twilio-studio | `v1` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/twilio-studio/__tests__/triggerStudioFlow.test.ts#L24) |
| 81 | usermotion | `v1` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/usermotion/index.ts#L60) |
| 82 | vibe-audience | `v1` ✓ | Constants file | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/vibe-audience/constants.ts#L2) |
| 83 | voyage | `v1` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/voyage/utils.ts#L1) |
| 84 | yahoo-audiences | `v1` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/yahoo-audiences/utils-tax.ts#L80) |
| 85 | yotpo | `v2` ✓ | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/yotpo/index.ts#L28) |

## Verification Status

✓ = Version claim verified by analyzing the source code at the specified line number

### Verification Methodology

Each API version claim was verified by:
1. Reading the exact source file for each destination
2. Locating the line containing the version information
3. Extracting the version string from either:
   - Explicit constant declarations (e.g., `export const API_VERSION = 'v21.0'`)
   - API endpoint URLs containing version paths (e.g., `https://api.example.com/v1/...`)
4. Recording the exact line number for the permalink

## Notes

### Version Identification Methods

API versions were identified through multiple approaches:

1. **Constants Files**: Destinations that define explicit version constants (e.g., `API_VERSION = 'v1'`)
2. **URL Patterns**: Destinations where the version is embedded in the API endpoint URL (e.g., `https://api.example.com/v1/...`)
3. **Dynamic Versioning**: Some destinations use feature flags or settings to determine versions at runtime

### Destinations Without Explicit Versions

Approximately 113 destinations either:
- Use unversioned API endpoints
- Have version information embedded in other configuration
- Use API endpoints where version is not explicitly visible in the code

### Notable Versioning Patterns

1. **Facebook Conversions API** (`v21.0`): Uses dynamic version selection with canary support
2. **LinkedIn Audiences** (`202505`): Uses date-based versioning (YYYYMM format)
3. **Google APIs**: Multiple Google destinations use different version schemes (v1, v2, v4)
4. **Amplitude & Mixpanel**: Use unversioned or path-based endpoints
5. **Braze**: Uses unversioned REST endpoints (`/users/track`)

## Sample Verifications

Examples of verified version information:

### Facebook Conversions API
- **File**: `constants.ts`, Line 1
- **Content**: `export const API_VERSION = '21.0'`
- **Verified**: ✓

### LinkedIn Audiences
- **File**: `constants.ts`, Line 1
- **Content**: `export const LINKEDIN_API_VERSION = '202505'`
- **Verified**: ✓

### Pinterest Conversions
- **File**: `constants.ts`, Line 1
- **Content**: `export const API_VERSION = 'v5'`
- **Verified**: ✓

## Maintenance Notes

This report was generated by analyzing TypeScript files in the `packages/destination-actions/src/destinations` directory.
The analysis:
- Searched for version constants in `constants.ts` files
- Parsed versioned URLs in API endpoint definitions
- Examined version patterns in action `index.ts` files
- Recorded exact line numbers for each version declaration
- Verified each claim against the actual source code

