# API Versions in Segment Action Destinations

This report identifies the API versions used across all destination integrations in the action-destinations repository.

**Total destinations analyzed:** 198
**Destinations with identifiable API versions:** 85

## Summary

Below is a comprehensive table of all destinations that use versioned APIs, including:
- The destination name
- The API version identified (either from constants or extracted from API URLs)
- A permalink to the source file containing the version information

## Destinations with API Versions

| # | Destination | API Version | Version Location | Source File |
|---|-------------|-------------|------------------|-------------|
| 1 | 1plusx | `v2` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/1plusx/sendPageview/index.ts) |
| 2 | 1plusx-asset-api | `v2` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/1plusx-asset-api/sendAssetData/index.ts) |
| 3 | aampe | `v1` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/aampe/constants.ts) |
| 4 | absmartly | `v1` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/absmartly/index.ts) |
| 5 | adobe-target | `v1` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/adobe-target/adobeTarget_operations.ts) |
| 6 | aggregations-io | `v1` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/aggregations-io/index.ts) |
| 7 | ambee | `v1` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/ambee/index.ts) |
| 8 | antavo | `v1` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/antavo/event/index.ts) |
| 9 | attentive | `v1` | Constants file | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/attentive/constants.ts) |
| 10 | attio | `v1` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/attio/index.ts) |
| 11 | avo | `v1` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/avo/sendSchemaToInspector/index.ts) |
| 12 | canvas | `v1` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/canvas/api.ts) |
| 13 | close | `v1` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/close/index.ts) |
| 14 | dawn | `v1` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/dawn/utils.ts) |
| 15 | display-video-360 | `v2` | Constants file | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/display-video-360/constants.ts) |
| 16 | dotdigital | `v2` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/dotdigital/sendTransactionalSms/index.ts) |
| 17 | drip | `v2` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/drip/index.ts) |
| 18 | engage-messaging-sendgrid | `v3` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/engage-messaging-sendgrid/index.ts) |
| 19 | engage-messaging-twilio | `v1` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/engage-messaging-twilio/utils/TwilioMessageSender.ts) |
| 20 | facebook-conversions-api | `21.0` | Constants file | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/facebook-conversions-api/constants.ts) |
| 21 | facebook-custom-audiences | `v21.0` | Constants file | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/facebook-custom-audiences/constants.ts) |
| 22 | first-party-dv360 | `v4` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/first-party-dv360/index.ts) |
| 23 | gainsight-px-cloud-action | `v1` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/gainsight-px-cloud-action/regional-endpoints.ts) |
| 24 | google-analytics-4 | `v2` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/google-analytics-4/addPaymentInfo/index.ts) |
| 25 | google-campaign-manager-360 | `v4` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/google-campaign-manager-360/index.ts) |
| 26 | google-enhanced-conversions | `v3` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/google-enhanced-conversions/index.ts) |
| 27 | google-sheets | `v4` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/google-sheets/index.ts) |
| 28 | hilo | `v1` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/hilo/index.ts) |
| 29 | hubspot | `v3` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/hubspot/upsertCustomObjectRecord/index.ts) |
| 30 | hyperengage | `v1` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/hyperengage/index.ts) |
| 31 | insider-audiences | `v1` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/insider-audiences/insiderAudiences/__tests__/index.test.ts) |
| 32 | launchdarkly-audiences | `v2` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/launchdarkly-audiences/constants.ts) |
| 33 | linkedin-audiences | `202505` | Constants file | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/linkedin-audiences/constants.ts) |
| 34 | linkedin-conversions | `202505` | Constants file | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/linkedin-conversions/constants.ts) |
| 35 | listrak | `v1` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/listrak/updateEmailContactProfileFields/index.ts) |
| 36 | livelike-cloud | `v1` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/livelike-cloud/constants.ts) |
| 37 | loops | `v1` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/loops/index.ts) |
| 38 | magellan-ai | `v2` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/magellan-ai/index.ts) |
| 39 | mantle | `v1` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/mantle/config.ts) |
| 40 | marketo-static-lists | `v1` | Constants file | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/marketo-static-lists/constants.ts) |
| 41 | metronome | `v1` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/metronome/index.ts) |
| 42 | ms-bing-ads-audiences | `v13` | Constants file | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/ms-bing-ads-audiences/constants.ts) |
| 43 | ms-bing-capi | `v1` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/ms-bing-capi/sendEvent/constants.ts) |
| 44 | nextdoor-capi | `v2` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/nextdoor-capi/index.ts) |
| 45 | optimizely-feature-experimentation-actions | `v2` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/optimizely-feature-experimentation-actions/index.ts) |
| 46 | optimizely-web | `v2` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/optimizely-web/trackEvent/client.ts) |
| 47 | outfunnel | `v1` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/outfunnel/index.ts) |
| 48 | pinterest-conversions | `v5` | Constants file | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/pinterest-conversions/constants.ts) |
| 49 | pipedrive | `v1` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/pipedrive/index.ts) |
| 50 | prodeology | `v1` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/prodeology/index.ts) |
| 51 | reddit-audiences | `v1` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/reddit-audiences/index.ts) |
| 52 | reddit-conversions-api | `v2.0` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/reddit-conversions-api/index.ts) |
| 53 | responsys | `v1` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/responsys/utils.ts) |
| 54 | revend | `v2` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/revend/signUp/index.ts) |
| 55 | roadwayai | `v1` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/roadwayai/index.ts) |
| 56 | rokt-audiences | `v3` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/rokt-audiences/constants.ts) |
| 57 | s3 | `v3` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/s3/syncToS3/client.ts) |
| 58 | salesforce-marketing-cloud | `v2` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/salesforce-marketing-cloud/index.ts) |
| 59 | segment | `v1` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/segment/properties.ts) |
| 60 | segment-profiles | `v1` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/segment-profiles/properties.ts) |
| 61 | sendgrid | `v3` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/sendgrid/__tests__/index.test.ts) |
| 62 | sendgrid-audiences | `v3` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/sendgrid-audiences/index.ts) |
| 63 | singlestore | `v2` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/singlestore/index.ts) |
| 64 | snap-audiences | `v1` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/snap-audiences/index.ts) |
| 65 | snap-conversions-api | `v3` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/snap-conversions-api/_tests_/index.test.ts) |
| 66 | spiffy | `v1` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/spiffy/index.ts) |
| 67 | sprig | `v2` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/sprig/identifyUser/index.ts) |
| 68 | surveysparrow | `v3` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/surveysparrow/index.ts) |
| 69 | talon-one | `v2` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/talon-one/updateCustomerProfileV3/index.ts) |
| 70 | the-trade-desk-crm | `v3` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/the-trade-desk-crm/index.ts) |
| 71 | tiktok-app-events | `v1.3` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/tiktok-app-events/index.ts) |
| 72 | tiktok-audiences | `v1.3` | Constants file | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/tiktok-audiences/constants.ts) |
| 73 | tiktok-conversions | `v1.3` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/tiktok-conversions/index.ts) |
| 74 | tiktok-conversions-sandbox | `v1.3` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/tiktok-conversions-sandbox/index.ts) |
| 75 | tiktok-offline-conversions | `v1.3` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/tiktok-offline-conversions/index.ts) |
| 76 | tiktok-offline-conversions-sandbox | `v1.3` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/tiktok-offline-conversions-sandbox/index.ts) |
| 77 | toplyne | `v1` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/toplyne/constants.ts) |
| 78 | topsort | `v2` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/topsort/client.ts) |
| 79 | twilio-messaging | `v1` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/twilio-messaging/sendMessage/constants.ts) |
| 80 | twilio-studio | `v1` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/twilio-studio/__tests__/triggerStudioFlow.test.ts) |
| 81 | usermotion | `v1` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/usermotion/index.ts) |
| 82 | vibe-audience | `v1` | Constants file | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/vibe-audience/constants.ts) |
| 83 | voyage | `v1` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/voyage/utils.ts) |
| 84 | yahoo-audiences | `v1` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/yahoo-audiences/utils-tax.ts) |
| 85 | yotpo | `v2` | API URL pattern | [View](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/yotpo/index.ts) |

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

## Maintenance Notes

This report was generated by analyzing TypeScript files in the `packages/destination-actions/src/destinations` directory.
The analysis looked for:
- Version constants in `constants.ts` files
- Versioned URLs in API endpoint definitions
- Version patterns in action `index.ts` files

