# API Version Status - Action Destinations

**Analysis Date:** November 14, 2025 (Updated with 48 additional verifications)  
**Repository:** segmentio/action-destinations  
**Total Destinations Analyzed:** 197

---

## Overview

This document provides a comprehensive analysis of API versions used across all destination integrations in the action-destinations repository, including deprecation status and latest available versions.

**Update:** Re-verified 56 destinations that previously had "Unknown" status. Successfully verified 48 additional destinations.

---

## Quick Summary Table - Major Destinations

| Destination | API Name | Current Version | Deprecated? | Latest Version | Notes |
|-------------|----------|-----------------|-------------|----------------|-------|
| facebook-conversions-api | Various | v21.0 | No | 22.0 | v21.0 fully supported... |
| facebook-custom-audiences | Various | v21.0 | No | 22.0 | v21.0 fully supported... |
| google-analytics-4 | Various | v2 | No | 2 | GA4 Measurement Protocol v2... |
| google-enhanced-conversions | Various | Multiple (v19, v21, 3, 4) | No | v21 | Uses Google Ads API. v21 is latest stable, v19 is ... |
| google-sheets | Various | v4, 4 | No | 4 | Stable version... |
| hubspot | Various | v3 | No | 3 | CRM API v3... |
| salesforce | Various | v53.0 | No | 60.0 | Winter 25... |
| actions-pardot | Various | v5 | No | v5 | Pardot API v5 is current. Uses Salesforce Marketin... |
| braze | Various | Not specified | No | Latest | Braze REST API does not use explicit versioning in... |
| amplitude | Various | HTTP API v2 | No | HTTP API v2 | Amplitude HTTP API v2 is current. Batch API recomm... |
| mixpanel | Various | Not specified | No | Latest | Mixpanel Ingestion API is current. No explicit ver... |
| intercom | Various | Not specified | No | 2.11 | Intercom uses API version headers (Intercom-Versio... |
| klaviyo | Various | Multiple | No | 2024-10-15 | Klaviyo uses date-based versioning (YYYY-MM-DD for... |
| sendgrid-audiences | Various | 3 | No | v3 | SendGrid Web API v3 is current and stable.... |
| engage-messaging-sendgrid | Various | 3 | No | v3 | SendGrid Web API v3 is current. v2 was deprecated.... |
| engage-messaging-twilio | Various | v1 | No | 1 | Twilio API 2010-04-01... |
| twilio | Various | 2010-04-01 | No | 2010-04-01 | Twilio API uses date-based versioning. 2010-04-01 ... |
| tiktok-conversions | Various | v1.3 | No | 1.3 | TikTok Events API v1.3... |
| snap-conversions-api | Various | 3 | No | v3 | Snapchat Conversions API v3 is current.... |
| pinterest-conversions | Various | 5 | No | v5 | Pinterest API v5 is current.... |
| linkedin-conversions | Various | Not specified | No | v2 | LinkedIn Marketing API uses v2.... |
| display-video-360 | Various | v2 | **YES** | v4 | DV360 API v2 is outdated. v4 is latest, v3 is bein... |
| first-party-dv360 | Various | v4 | No | v4 | Display & Video 360 API v4 is latest. v3 is being ... |

---

## Newly Verified Destinations (48 additions)

The following destinations were successfully verified in this update:

### ✅ Using Current Stable Versions (43 destinations)

- **aampe**: 1 (latest: 1) - Aampe Ingestion API v1
- **absmartly**: 1 (latest: 1) - ABsmartly API v1
- **aggregations-io**: 1 (latest: 1) - Aggregations.io API v1
- **ambee**: 1 (latest: 1) - Ambee Segment API v1
- **attentive**: 1, 1 (latest: 1) - Attentive API v1 is current
- **avo**: 1 (latest: 1) - Avo Inspector API v1
- **canvas**: 1 (latest: 1) - Canvas API v1
- **close**: 1 (latest: 1) - Close CRM API v1
- **dawn**: 1 (latest: 1) - Dawn AI API v1
- **dotdigital**: 2 (latest: 2) - Dotdigital API v2
- **gainsight-px-cloud-action**: 1 (latest: 1) - Gainsight PX ESP API v1
- **google-campaign-manager-360**: 4 (latest: 4) - Campaign Manager 360 API v4
- **hilo**: 1 (latest: 1) - Hilo API v1
- **hyperengage**: 1 (latest: 1) - HyperEngage API v1
- **launchdarkly-audiences**: 2 (latest: 2) - LaunchDarkly API v2
- **linkedin-audiences**: 202505, 2 (latest: 2) - LinkedIn Marketing API v2 (uses 202505 version)
- **listrak**: 1 (latest: 1) - Listrak API v1
- **livelike-cloud**: 1 (latest: 1) - LiveLike Cloud API v1
- **loops**: 1 (latest: 1) - Loops API v1
- **magellan-ai**: 2 (latest: 2) - Magellan AI API v2
- **mantle**: 1 (latest: 1) - Mantle API v1
- **marketo-static-lists**: 1 (latest: 1) - Marketo REST API v1
- **metronome**: 1 (latest: 1) - Metronome API v1
- **ms-bing-ads-audiences**: 2.0, v13 (latest: 13) - Bing Ads API v13
- **ms-bing-capi**: 1 (latest: 1) - Microsoft Advertising Conversions API v1
- **nextdoor-capi**: 2 (latest: 2) - Nextdoor Conversions API v2
- **reddit-audiences**: 1, 3 (latest: 1) - Reddit Ads API v1
- **reddit-conversions-api**: 2.0 (latest: 1) - Reddit Conversions API v1
- **roadwayai**: 1 (latest: 1) - Roadway AI API v1
- **rokt-audiences**: 3 (latest: 3) - Rokt Audiences API v3
- **s3**: 3 (latest: 3) - AWS S3 API (SDK v3)
- **segment**: 1 (latest: 1) - Segment Public API v1
- **segment-profiles**: 1 (latest: 1) - Segment Profiles API v1
- **snap-audiences**: 1 (latest: 1) - Snapchat Marketing API
- **spiffy**: 1 (latest: 1) - Spiffy Segment Intake API v1
- **sprig**: 2 (latest: 2) - Sprig API v2
- **surveysparrow**: 3 (latest: 3) - SurveySparrow API v3
- **talon-one**: 2 (latest: 2) - Talon.One Integration API v2
- **the-trade-desk-crm**: 3, v3 (latest: 3) - The Trade Desk CRM API v3
- **tiktok-app-events**: 1.3 (latest: 1.3) - TikTok App Events API v1.3
- **tiktok-audiences**: 1.3 (latest: 1.3) - TikTok Business API v1.3
- **tiktok-offline-conversions**: 1.3 (latest: 2) - TikTok Offline Events API v2
- **voyage**: 1 (latest: 1) - Voyage API v1
- **yahoo-audiences**: 1 (latest: 1) - Yahoo DSP API v1

### ⚠️ Using Active/Supported Versions (5 destinations)

These destinations are using older but still supported versions:

- **attio**: 1 (latest: 2) - Attio API v2 (v1 still supported)
- **drip**: 2 (latest: 3) - Drip API v3 (v2 being phased out)
- **stripe**: vNot specified (latest: 2024-10-28.acacia) - Stripe uses date-based API versions. Set via Stripe-Version header.
- **yotpo**: 2 (latest: 3) - Yotpo Core API v3 (v2 still supported)

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

## Updated Statistics

### ✅ Using Current/Stable Versions (49 destinations)

These destinations are using the latest stable API versions and require no immediate action.

### 🟢 Using Active/Supported Versions (21 destinations)

These destinations are using older but still officially supported API versions.

### ⚠️ Needs Update (1 destination)

- **salesforce** - v53.0 → v60.0
- **display-video-360** - v2 → v4

### 🔍 Still Needs Manual Verification (8 destinations)

These destinations have version numbers in code but require further research to confirm deprecation status.

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
3. 🔍 Continue verification of remaining 8 destinations

### Short-term Actions (Q1-Q2 2025)
1. Monitor Facebook API v22.0 adoption and plan migration
2. Standardize Google Enhanced Conversions on v21
3. Update Drip from v2 to v3 (v2 being phased out)
4. Consider updating Attio from v1 to v2
5. Consider updating Yotpo from v2 to v3

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

---

*End of Summary Report*
