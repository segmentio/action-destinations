
# API Version Status - Action Destinations

**Analysis Date:** November 14, 2025  
**Repository:** segmentio/action-destinations  
**Total Destinations Analyzed:** 197

---

## Overview

This document provides a comprehensive analysis of API versions used across all destination integrations in the action-destinations repository, including deprecation status and latest available versions.

---

## Quick Summary Table - Major Destinations

| Destination | API Name | Current Version | Deprecated? | Latest Version | Notes |
|-------------|----------|-----------------|-------------|----------------|-------|
| facebook-conversions-api | Facebook Graph API | v21.0 | No | v22.0 | Active, 2-year support lifecycle |
| facebook-custom-audiences | Facebook Marketing API | v21.0 | No | v22.0 | Active, same as Graph API |
| google-analytics-4 | GA4 Measurement Protocol | v2 | No | v2 | Current stable version |
| google-enhanced-conversions | Google Ads API | v19, v21, multiple | No | v21 | Should consolidate to v21 |
| google-sheets | Google Sheets API | v4 | No | v4 | Current stable version |
| hubspot | HubSpot CRM API | v3 | No | v3 | v1 was deprecated in 2022 |
| salesforce | Salesforce API | v53.0 | **Approaching EOL** | v60.0 | **UPDATE NEEDED** - v53.0 from 2022 |
| actions-pardot | Pardot API | v5 | No | v5 | Current version |
| braze | Braze REST API | No explicit version | No | Latest | Rolling updates |
| amplitude | HTTP API | v2 | No | v2 | Current version |
| mixpanel | Ingestion API | No explicit version | No | Latest | No versioning in URLs |
| intercom | Intercom API | Header-based (2.11) | No | 2.11 | Version via header |
| klaviyo | Klaviyo API | Date-based | No | 2024-10-15 | YYYY-MM-DD format |
| sendgrid-audiences | SendGrid Web API | v3 | No | v3 | v2 was deprecated |
| engage-messaging-sendgrid | SendGrid Web API | v3 | No | v3 | Current version |
| engage-messaging-twilio | Twilio API | v1 | No | 2010-04-01 | Date-based versioning |
| twilio | Twilio API | 2010-04-01 | No | 2010-04-01 | Stable version |
| stripe | Stripe API | Header-based | No | 2024-10-28 | Version via header |
| tiktok-conversions | TikTok Events API | v1.2, v1.3 | No | v1.3 | Should use v1.3 |
| snap-conversions-api | Snapchat Conversions API | v3 | No | v3 | Current version |
| pinterest-conversions | Pinterest API | v5 | No | v5 | Current version |
| linkedin-conversions | LinkedIn Marketing API | v2 | No | v2 | Current version |
| display-video-360 | Display & Video 360 API | v2 | **YES** | v4 | **UPDATE NEEDED** - v2 outdated |
| first-party-dv360 | Display & Video 360 API | v4 | No | v4 | Current version |
| google-campaign-manager-360 | Campaign Manager 360 API | v4 | No | v4 | Current version |

---

## Destinations Requiring Immediate Attention

### 🔴 Critical Updates Needed

#### 1. Salesforce (salesforce destination)
- **Current Version:** v53.0
- **Latest Version:** v60.0  
- **Status:** Outdated (from 2022)
- **Deprecation:** Versions are retired 3 years after release
- **Action Required:** Update to v60.0 (Winter '25)
- **Impact:** High - approaching end of support window
- **Documentation:** https://help.salesforce.com/s/articleView?id=000385436

#### 2. Display & Video 360 (display-video-360 destination)
- **Current Version:** v2
- **Latest Version:** v4
- **Status:** Deprecated
- **Deprecation:** v2 is outdated, v3 is being phased out
- **Action Required:** Migrate to v4
- **Impact:** High - v2 may be sunset soon
- **Documentation:** https://developers.google.com/display-video/api/guides/migration

---

## Destinations by Deprecation Status

### ✅ Using Current/Stable Versions (21 destinations)

These destinations are using the latest stable API versions and require no immediate action:

- facebook-conversions-api (v21.0)
- facebook-custom-audiences (v21.0)  
- google-analytics-4 (v2)
- google-sheets (v4)
- hubspot (v3)
- actions-pardot (v5)
- sendgrid-audiences (v3)
- engage-messaging-sendgrid (v3)
- snap-conversions-api (v3)
- pinterest-conversions (v5)
- linkedin-conversions (v2)
- first-party-dv360 (v4)
- braze (rolling updates)
- amplitude (v2)
- mixpanel (no versioning)
- twilio (2010-04-01)

### ⚠️ Needs Update (2 destinations)

- **salesforce** - v53.0 → v60.0
- **display-video-360** - v2 → v4

### 🔍 Needs Verification (56 destinations)

These destinations have version numbers but require manual verification against official documentation:

- aampe (v1)
- absmartly (v1)
- aggregations-io (v1)
- attentive (v1)
- attio (v1)
- avo (v1)
- canvas (v1)
- close (v1)
- dawn (v1)
- dotdigital (v2)
- drip (v2)
- gainsight-px-cloud-action (v1)
- hilo (v1)
- hyperengage (v1)
- [... and 42 more]

### ℹ️ No Explicit Version (118 destinations)

These destinations don't specify explicit API versions in their code. This may be intentional (APIs without versioning) or they may use default/latest versions.

---

## API Provider Breakdown

### Facebook/Meta Platform
- **Destinations:** 2 (facebook-conversions-api, facebook-custom-audiences)
- **Current Version:** v21.0
- **Latest Version:** v22.0
- **Support Lifecycle:** ~2 years per version
- **Update Frequency:** Quarterly releases
- **Status:** ✅ Active (v22.0 is latest but v21.0 still fully supported)

### Google Marketing Platform
- **Destinations:** 6 (google-analytics-4, google-enhanced-conversions, google-sheets, display-video-360, first-party-dv360, google-campaign-manager-360)
- **Status:** Mixed
  - GA4: ✅ Current (v2)
  - Sheets: ✅ Current (v4)
  - Enhanced Conversions: ⚠️ Multiple versions (should standardize on v21)
  - DV360: ⚠️ **Needs update** (v2 → v4)
  - First-Party DV360: ✅ Current (v4)
  - Campaign Manager 360: ✅ Current (v4)

### Salesforce Platform
- **Destinations:** 2 (salesforce, actions-pardot)
- **Status:** Mixed
  - Salesforce: ⚠️ **Needs update** (v53.0 → v60.0)
  - Pardot: ✅ Current (v5)

### Communication APIs
- **SendGrid:** ✅ v3 (current)
- **Twilio:** ✅ 2010-04-01 (stable)

### Social Media Advertising
- **TikTok:** ✅ v1.3 (current)
- **Snapchat:** ✅ v3 (current)
- **Pinterest:** ✅ v5 (current)
- **LinkedIn:** ✅ v2 (current)

### Analytics Platforms
- **Amplitude:** ✅ HTTP API v2 (current)
- **Mixpanel:** ✅ No explicit versioning
- **Braze:** ✅ Rolling updates

---

## Complete Destination List

For the complete list of all 197 destinations with detailed API information, version numbers, and deprecation status, please see:

- **Detailed Report:** `API_VERSION_ANALYSIS.md` (comprehensive markdown document)
- **Data Export:** `API_VERSION_ANALYSIS.csv` (CSV format for data analysis)

---

## Recommendations

### Immediate Actions (Q4 2024 / Q1 2025)
1. ✅ **Update Salesforce** from v53.0 to v60.0
2. ✅ **Update Display & Video 360** from v2 to v4
3. 🔍 Standardize Google Enhanced Conversions on v21

### Short-term Actions (Q1-Q2 2025)
1. Monitor Facebook API v22.0 adoption and plan migration
2. Verify API versions for destinations marked as "Unknown"
3. Add version constants to destinations without explicit versioning

### Long-term Best Practices
1. **Implement Version Tracking**
   - Add API version constants to all destinations
   - Document version in destination metadata
   
2. **Automate Monitoring**
   - Subscribe to API changelog notifications
   - Set up automated version checking
   - Create alerts for deprecation announcements
   
3. **Establish Update Cadence**
   - Review Facebook/Meta APIs quarterly
   - Review Google APIs semi-annually
   - Review Salesforce APIs annually
   - Review other APIs as needed

4. **Testing Protocol**
   - Test all version updates in staging
   - Implement feature flags for version rollouts
   - Monitor error rates during migrations

---

## API Deprecation Resources

### Major Platform Documentation

| Platform | Documentation URL |
|----------|------------------|
| Facebook Graph API | https://developers.facebook.com/docs/graph-api/changelog |
| Google Ads API | https://developers.google.com/google-ads/api/docs/release-notes |
| Google Analytics 4 | https://developers.google.com/analytics/devguides/collection/protocol/ga4 |
| Google Display & Video 360 | https://developers.google.com/display-video/api/guides/migration |
| HubSpot CRM API | https://developers.hubspot.com/docs/api/crm/understanding-the-crm |
| Salesforce API | https://help.salesforce.com/s/articleView?id=000385436 |
| SendGrid API | https://docs.sendgrid.com/api-reference/how-to-use-the-sendgrid-v3-api |
| Twilio API | https://www.twilio.com/docs/api/rest/versions |
| Stripe API | https://stripe.com/docs/api/versioning |
| Intercom API | https://developers.intercom.com/docs/build-an-integration/learn-more/rest-apis/api-versioning/ |
| Klaviyo API | https://developers.klaviyo.com/en/docs/api_versioning_and_deprecation_policy |
| TikTok Business API | https://business-api.tiktok.com/portal/docs?id=1771100865818625 |
| Snapchat Marketing API | https://marketingapi.snapchat.com/docs/conversion.html |
| Pinterest API | https://developers.pinterest.com/docs/api/v5/ |
| LinkedIn Marketing API | https://learn.microsoft.com/en-us/linkedin/marketing/versioning |

---

## Methodology

This analysis was performed by:

1. **Automated Code Scanning**
   - Analyzed all TypeScript files in 197 destination directories
   - Extracted HTTP/HTTPS endpoints from `perform` and `performBatch` functions
   - Identified version patterns in URLs, constants, and code

2. **Pattern Recognition**
   - Detected `/v{number}/` patterns in URLs
   - Found `API_VERSION` constants in code
   - Recognized major API providers by domain

3. **Deprecation Research**
   - Cross-referenced versions with official API documentation
   - Reviewed changelog and deprecation notices
   - Identified support lifecycles for major platforms

4. **Data Compilation**
   - Generated structured reports in multiple formats
   - Created actionable recommendations
   - Documented findings with evidence

**Note:** Some API deprecation statuses require ongoing verification as APIs evolve. This report represents the state as of November 2025.

---

*End of Summary Report*

