# Comprehensive API Version Analysis Report
## Action Destinations Repository

**Generated:** 2025-11-14T09:53:56.827Z  
**Total Destinations Analyzed:** 197  
**Destinations with Explicit Versions:** 79

---

## Executive Summary

This report analyzes all destination integrations in the action-destinations repository to identify:
1. **API versions** currently in use
2. **Deprecation status** of those versions
3. **Latest available versions** for each API

### Key Findings

- **197 destinations** have API integrations
- **79 destinations** specify explicit API versions
- **23 major APIs** have detailed deprecation information available
- Several destinations use outdated API versions that should be updated

---

## Detailed Analysis by Destination

The following table provides a comprehensive overview of all destination integrations:

| Destination | Primary API Endpoint | Current Version | Status | Latest Version | Notes |
|-------------|---------------------|-----------------|--------|----------------|-------|
| 1plusx | tagger-test.opecloud.com | Not specified | N/A | N/A |  |
| 1plusx-asset-api | us.1plusx.io | Not specified | N/A | N/A |  |
| aampe | ingestion-service-asia-southeast1-toqowp62ka-as.a.run.app | 1 | Unknown | Unknown | Requires manual verification |
| absmartly | you-subdomain.absmartly.io | 1 | Unknown | Unknown | Requires manual verification |
| accoil-analytics | instaging.accoil.com | Not specified | N/A | N/A |  |
| acoustic | api-campaign-${settings.region | Not specified | N/A | N/A |  |
| acoustic-s3tc | ${opts.host | Not specified | N/A | N/A |  |
| actable-predictive | api.converscience.com | Not specified | N/A | N/A |  |
| actions-pardot | help.salesforce.com | v5 | Active | v5 | Pardot API v5 is current. Uses Salesforce Marketing Cloud Account Engagement. |
| adjust | s2s.adjust.com | Not specified | N/A | N/A |  |
| adobe-target | ${this.clientcode | Not specified | N/A | N/A |  |
| aggregations-io | app.aggregations.io | 1 | Unknown | Unknown | Requires manual verification |
| airship | docs.airship.com | Not specified | N/A | N/A |  |
| algolia-insights | insights.algolia.io | Not specified | N/A | N/A |  |
| amazon-amc | advertising.amazon.com | Not specified | N/A | N/A |  |
| amazon-conversions-api | advertising-api.amazon.com | Not specified | N/A | N/A |  |
| amazon-eventbridge | N/A | Not specified | N/A | N/A |  |
| ambee | segment-api.ambeedata.com | 1 | Unknown | Unknown | Requires manual verification |
| amplitude | api.eu.amplitude.com | Not specified | Active | HTTP API v2 | Amplitude HTTP API v2 is current. Batch API recommended for high volume. |
| angler-ai | data.getangler.ai | Not specified | N/A | N/A |  |
| antavo | api.${data.settings.stack | Not specified | N/A | N/A |  |
| apolloio | apollo.io | Not specified | N/A | N/A |  |
| app-fit | api.appfit.io | Not specified | N/A | N/A |  |
| attentive | api.attentivemobile.com | v1, 1 | Unknown | Unknown | Requires manual verification |
| attio | api.attio.com | 1 | Unknown | Unknown | Requires manual verification |
| avo | api.avo.app | 1 | Unknown | Unknown | Requires manual verification |
| aws-kinesis | aws.amazon.com | Not specified | N/A | N/A |  |
| aws-s3 | docs.aws.amazon.com | Not specified | N/A | N/A |  |
| batch | api.batch.com | Not specified | N/A | N/A |  |
| bing-ads-audiences | www.example.com | Not specified | N/A | N/A |  |
| blackbaud-raisers-edge-nxt | oauth2.sky.blackbaud.com | Not specified | N/A | N/A |  |
| blend-ai | api.blnd.ai | Not specified | N/A | N/A |  |
| braze | www.braze.com | Not specified | Active | Latest | Braze REST API does not use explicit versioning in URLs. Uses rolling updates. |
| braze-cohorts | www.braze.com | Not specified | N/A | N/A |  |
| calliper | api.getcalliper.com | Not specified | N/A | N/A |  |
| canny-functions | canny.io | Not specified | N/A | N/A |  |
| canvas | events.canvasapp.com | 1 | Unknown | Unknown | Requires manual verification |
| chartmogul | N/A | Not specified | N/A | N/A |  |
| clay | segment-session.clay.com | Not specified | N/A | N/A |  |
| clevertap | docs.clevertap.com | Not specified | N/A | N/A |  |
| close | services.close.com | 1 | Unknown | Unknown | Requires manual verification |
| contentstack | N/A | Not specified | N/A | N/A |  |
| cordial | support.cordial.com | Not specified | N/A | N/A |  |
| courier | api.${region | Not specified | N/A | N/A |  |
| criteo | example.com | Not specified | N/A | N/A |  |
| criteo-audiences | api.criteo.com | Not specified | N/A | N/A |  |
| customerio | customer.io | Not specified | N/A | N/A |  |
| dawn | api2.dawnai.com | 1 | Unknown | Unknown | Requires manual verification |
| delivrai-activate | dev.cdpresolution.com | Not specified | N/A | N/A |  |
| devrev | devrev.ai | Not specified | N/A | N/A |  |
| display-video-360 | audiencepartner.googleapis.com | v2 | Outdated | v4 | DV360 API v2 is outdated. v4 is latest, v3 is being deprecated. |
| dotdigital | support.dotdigital.com | 2 | Unknown | Unknown | Requires manual verification |
| drip | api.getdrip.com | 2 | Unknown | Unknown | Requires manual verification |
| dub | api.dub.co | Not specified | N/A | N/A |  |
| dynamic-yield-audiences | cdp-extensions-api.${getdomain(datacenter | Not specified | N/A | N/A |  |
| eagleeye-audiences | N/A | Not specified | N/A | N/A |  |
| emarsys | api.emarsys.net | Not specified | N/A | N/A |  |
| encharge | help.encharge.io | Not specified | N/A | N/A |  |
| engage-messaging-sendgrid | api.sendgrid.com | 3, 2 | Active | 3 | SendGrid Web API v3 is current. v2 was deprecated. |
| engage-messaging-twilio | ${hostname | 1 | Unknown | Unknown | Requires manual verification |
| epsilon | login.dotomi.com | Not specified | N/A | N/A |  |
| equals | N/A | Not specified | N/A | N/A |  |
| facebook-conversions-api | developers.facebook.com | 21.0 | Active | 22.0 | Facebook Graph API versions are typically supported for 2 years. v21.0 was released in Oct 2024, v22.0 is latest as of Nov 2024. Older versions below v18.0 are deprecated. |
| facebook-custom-audiences | graph.facebook.com | v21.0 | Active | v22.0 | Uses Facebook Marketing API. Same lifecycle as Graph API - versions supported for ~2 years. |
| first-party-dv360 | displayvideo.googleapis.com | v4, 4, 3 | Active | v4 | Display & Video 360 API v4 is latest. v3 is being phased out. |
| friendbuy | mapi.fbot.me | Not specified | N/A | N/A |  |
| fullstory | help.fullstory.com | Not specified | N/A | N/A |  |
| gainsight-px-cloud-action | segment-esp.aptrinsic.com | 1 | Unknown | Unknown | Requires manual verification |
| gameball | help.gameball.co | Not specified | N/A | N/A |  |
| gleap | api.gleap.io | Not specified | N/A | N/A |  |
| google-analytics-4 | developers.google.com | 2 | Active | 2 | GA4 Measurement Protocol v2 is the current version. Replaces deprecated Universal Analytics. |
| google-campaign-manager-360 | support.google.com | 4 | Unknown | Unknown | Requires manual verification |
| google-data-manager | www.example.com | Not specified | N/A | N/A |  |
| google-enhanced-conversions | developers.google.com | 4, 21, v19, v21, 3, 1, 11 | Active | v21 | Uses Google Ads API. v21 is latest stable, v19 is still supported. |
| google-sheets | sheets.googleapis.com | v4, 4 | Active | v4 | Google Sheets API v4 is current and stable. |
| google-sheets-dev | docs.google.com | Not specified | N/A | N/A |  |
| gwen | gwen.insertcoin.se | Not specified | N/A | N/A |  |
| heap | heapanalytics.com | Not specified | N/A | N/A |  |
| hilo | api.hilohq.com | 1 | Unknown | Unknown | Requires manual verification |
| hubspot | knowledge.hubspot.com | 3 | Active | 3 | HubSpot CRM API v3 is current. v1 was deprecated in 2022. |
| hyperengage | events.hyperengage.io | 1 | Unknown | Unknown | Requires manual verification |
| inleads-ai | server.inleads.ai | Not specified | N/A | N/A |  |
| insider | unification.useinsider.com | Not specified | N/A | N/A |  |
| insider-audiences | unification.useinsider.com | Not specified | N/A | N/A |  |
| intercom | api.intercom.io | Not specified | Active | 2.11 | Intercom uses API version headers (Intercom-Version). Latest is 2.11. |
| iqm | postback.iqm.com | Not specified | N/A | N/A |  |
| ironclad | pactsafe.io | Not specified | N/A | N/A |  |
| iterable | github.com | Not specified | N/A | N/A |  |
| iterable-lists | api.iterable.com | Not specified | N/A | N/A |  |
| june | api.june.so | Not specified | N/A | N/A |  |
| kafka | N/A | Not specified | N/A | N/A |  |
| kameleoon | help.kameleoon.com | Not specified | N/A | N/A |  |
| kevel | dev.kevel.com | Not specified | N/A | N/A |  |
| kevel-audience | tr.${data.settings.audiencedomain | Not specified | N/A | N/A |  |
| klaviyo | a.klaviyo.com | Not specified | Active | 2024-10-15 | Klaviyo uses date-based versioning (YYYY-MM-DD format). Latest is 2024-10-15. |
| koala | localhost | Not specified | N/A | N/A |  |
| launchdarkly | docs.launchdarkly.com | Not specified | N/A | N/A |  |
| launchdarkly-audiences | docs.launchdarkly.com | 2 | Unknown | Unknown | Requires manual verification |
| launchpad | help.launchpad.pm | Not specified | N/A | N/A |  |
| linkedin-audiences | learn.microsoft.com | 202505, 2 | Unknown | Unknown | Requires manual verification |
| linkedin-conversions | learn.microsoft.com | 202505, 2 | Active | v2 | LinkedIn Marketing API uses v2. |
| listrak | admin.listrak.com. | 1 | Unknown | Unknown | Requires manual verification |
| livelike-cloud | cf-blast.livelikecdn.com | 1 | Unknown | Unknown | Requires manual verification |
| liveramp-audiences | docs.liveramp.com | Not specified | N/A | N/A |  |
| loops | app.loops.so | 1 | Unknown | Unknown | Requires manual verification |
| m3ter | api.m3ter.com | Not specified | N/A | N/A |  |
| magellan-ai | api.magellan.ai | 2 | Unknown | Unknown | Requires manual verification |
| mantle | appapi.heymantle.com | 1 | Unknown | Unknown | Requires manual verification |
| marketo-static-lists | N/A | v1 | Unknown | Unknown | Requires manual verification |
| metronome | api.metronome.com | 1 | Unknown | Unknown | Requires manual verification |
| mixpanel | help.mixpanel.com | Not specified | Active | Latest | Mixpanel Ingestion API is current. No explicit versioning in most endpoints. |
| moengage | api-01.moengage.com | Not specified | N/A | N/A |  |
| moloco-rmp | github.com | Not specified | N/A | N/A |  |
| movable-ink | N/A | Not specified | N/A | N/A |  |
| ms-bing-ads-audiences | learn.microsoft.com | 2.0, v13 | Unknown | Unknown | Requires manual verification |
| ms-bing-capi | forms.office.com | 1 | Unknown | Unknown | Requires manual verification |
| nextdoor-capi | ads.nextdoor.com | 2 | Unknown | Unknown | Requires manual verification |
| noop | N/A | Not specified | N/A | N/A |  |
| nudge | main-api.nudgenow.com | Not specified | N/A | N/A |  |
| optimizely-advanced-audience-targeting | function.eu1.ocp.optimizely.com | Not specified | N/A | N/A |  |
| optimizely-data-platform | function.zaius.app | Not specified | N/A | N/A |  |
| optimizely-feature-experimentation-actions | app.optimizely.com | 2, 1 | Unknown | Unknown | Requires manual verification |
| optimizely-web | api.optimizely.com | 2, 1 | Unknown | Unknown | Requires manual verification |
| ortto | segment-action-api-${region | v1 | Unknown | Unknown | Requires manual verification |
| ortto-audiences | segment-action-api-${region | v1 | Unknown | Unknown | Requires manual verification |
| outfunnel | api-pls.outfunnel.com | 1 | Unknown | Unknown | Requires manual verification |
| pinterest-conversions | developers.pinterest.com | v5, 5 | Active | 5 | Pinterest API v5 is current. |
| pipedrive | ${settings.domain | Not specified | N/A | N/A |  |
| playerzero-cloud | go.playerzero.app | Not specified | N/A | N/A |  |
| podscribe | verifi.podscribe.com | Not specified | N/A | N/A |  |
| posthog | posthog.com | Not specified | N/A | N/A |  |
| postscript | api.postscript.io | Not specified | N/A | N/A |  |
| prodeology | api-dev.prodeology.com | 1 | Unknown | Unknown | Requires manual verification |
| pushwoosh | www.pushwoosh.com | Not specified | N/A | N/A |  |
| qualtrics | www.qualtrics.com | Not specified | N/A | N/A |  |
| recombee | docs.recombee.com | Not specified | N/A | N/A |  |
| reddit-audiences | ads-api.reddit.com | 1, 3 | Unknown | Unknown | Requires manual verification |
| reddit-conversions-api | business.reddithelp.com | 2.0 | Unknown | Unknown | Requires manual verification |
| rehook | api.rehook.ai | Not specified | N/A | N/A |  |
| responsys | docs.oracle.com | 1 | Unknown | Unknown | Requires manual verification |
| revend | developers.google.com | 2 | Unknown | Unknown | Requires manual verification |
| revx | segmentdata.atomex.net | Not specified | N/A | N/A |  |
| ripe | api.getripe.com | Not specified | N/A | N/A |  |
| roadwayai | production.api.roadwayai.com | 1 | Unknown | Unknown | Requires manual verification |
| rokt-audiences | data.rokt.com | 3 | Unknown | Unknown | Requires manual verification |
| s3 | docs.aws.amazon.com | 3 | Unknown | Unknown | Requires manual verification |
| salesforce | help.salesforce.com | v53.0 | Active but outdated | v60.0 | Salesforce releases 3 versions per year. v53.0 is from 2022. Current is v60.0 (Winter '25). Versions are retired 3 years after release. |
| salesforce-marketing-cloud | developer.salesforce.com | Not specified | N/A | N/A |  |
| saleswings | ${env | Not specified | N/A | N/A |  |
| schematic | c.schematichq.com | Not specified | N/A | N/A |  |
| segment | api.segment.io | 1 | Unknown | Unknown | Requires manual verification |
| segment-profiles | api.segment.io | 1 | Unknown | Unknown | Requires manual verification |
| sendgrid | docs.sendgrid.com | Not specified | N/A | N/A |  |
| sendgrid-audiences | api.sendgrid.com | 3 | Active | 3 | SendGrid Web API v3 is current and stable. |
| sftp | N/A | Not specified | N/A | N/A |  |
| singlestore | ${host | Not specified | N/A | N/A |  |
| slack | api.slack.com | Not specified | N/A | N/A |  |
| snap-audiences | adsapi.snapchat.com | 1 | Unknown | Unknown | Requires manual verification |
| snap-conversions-api | marketingapi.snapchat.com | 3 | Active | 3 | Snapchat Conversions API v3 is current. |
| spiffy | segment-intake.spiffy.ai | 1 | Unknown | Unknown | Requires manual verification |
| sprig | api.sprig.com | 2 | Unknown | Unknown | Requires manual verification |
| stackadapt | tags.srv.stackadapt.com | Not specified | N/A | N/A |  |
| stackadapt-audiences | api.stackadapt.com | Not specified | N/A | N/A |  |
| surveysparrow | api.surveysparrow.com | 3 | Unknown | Unknown | Requires manual verification |
| survicate | integrations.survicate.com | Not specified | N/A | N/A |  |
| taboola-actions | backstage.taboola.com | Not specified | N/A | N/A |  |
| taguchi | N/A | Not specified | N/A | N/A |  |
| talon-one | integration.talon.one | 2 | Unknown | Unknown | Requires manual verification |
| the-trade-desk-crm | api.thetradedesk.com | 3, v3 | Unknown | Unknown | Requires manual verification |
| tiktok-app-events | business-api.tiktok.com | 1.3 | Unknown | Unknown | Requires manual verification |
| tiktok-audiences | business-api.tiktok.com | v1.3 | Unknown | Unknown | Requires manual verification |
| tiktok-conversions | ads.tiktok.com | 1.3 | Active | v1.3 | TikTok Events API v1.3 is current. |
| tiktok-conversions-sandbox | ads.tiktok.com | 1.3 | Unknown | Unknown | Requires manual verification |
| tiktok-offline-conversions | business-api.tiktok.com | 1.3 | Unknown | Unknown | Requires manual verification |
| tiktok-offline-conversions-sandbox | business-api.tiktok.com | 1.3 | Unknown | Unknown | Requires manual verification |
| toplyne | api.toplyne.io | 1 | Unknown | Unknown | Requires manual verification |
| topsort | api.topsort.com | 2 | Unknown | Unknown | Requires manual verification |
| trackey | app.trackey.io | Not specified | N/A | N/A |  |
| trubrics | ${settings.url | Not specified | N/A | N/A |  |
| twilio | api.twilio.com | Not specified | Active | 2010-04-01 | Twilio API uses date-based versioning. 2010-04-01 is stable and maintained. |
| twilio-messaging | api.twilio.com | 1 | Unknown | Unknown | Requires manual verification |
| twilio-messaging-omnichannel | www.twilio.com | Not specified | N/A | N/A |  |
| twilio-studio | www.twilio.com | Not specified | N/A | N/A |  |
| usermaven | events.usermaven.com | Not specified | N/A | N/A |  |
| usermotion | api.usermotion.com | 1 | Unknown | Unknown | Requires manual verification |
| userpilot | docs.userpilot.com | Not specified | N/A | N/A |  |
| vibe-audience | audience-ingester-api.vibe.co | v1 | Unknown | Unknown | Requires manual verification |
| voucherify | docs.voucherify.io | Not specified | N/A | N/A |  |
| voyage | app.voyagetext.com | 1 | Unknown | Unknown | Requires manual verification |
| vwo | dev.visualwebsiteoptimizer.com | Not specified | N/A | N/A |  |
| webhook | N/A | Not specified | N/A | N/A |  |
| webhook-audiences | N/A | Not specified | N/A | N/A |  |
| webhook-extensible | N/A | Not specified | N/A | N/A |  |
| xtremepush | N/A | Not specified | N/A | N/A |  |
| yahoo-audiences | datax.yahooapis.com | 1 | Unknown | Unknown | Requires manual verification |
| yonoma | api.yonoma.io | Not specified | N/A | N/A |  |
| yotpo | developers.yotpo.com | 2 | Unknown | Unknown | Requires manual verification |

---

## Destinations Requiring Immediate Attention

The following destinations use API versions that are **outdated, deprecated, or approaching end-of-life**:

### salesforce

- **Current Version:** v53.0
- **Latest Version:** v60.0
- **Notes:** Salesforce releases 3 versions per year. v53.0 is from 2022. Current is v60.0 (Winter '25). Versions are retired 3 years after release.
- **Documentation:** https://help.salesforce.com/s/articleView?id=000385436

### display-video-360

- **Current Version:** v2
- **Latest Version:** v4
- **Notes:** DV360 API v2 is outdated. v4 is latest, v3 is being deprecated.
- **Documentation:** https://developers.google.com/display-video/api/guides/migration

---

## Detailed API Information

### Major API Platforms Used

#### TikTok Business API
Used by 6 destination(s): tiktok-app-events, tiktok-audiences, tiktok-conversions, tiktok-conversions-sandbox, tiktok-offline-conversions, tiktok-offline-conversions-sandbox

#### Twilio API
Used by 5 destination(s): engage-messaging-twilio, twilio, twilio-messaging, twilio-messaging-omnichannel, twilio-studio

#### SendGrid API
Used by 3 destination(s): engage-messaging-sendgrid, sendgrid, sendgrid-audiences

#### LinkedIn API
Used by 2 destination(s): linkedin-audiences, linkedin-conversions

#### Amplitude API
Used by 1 destination(s): amplitude

#### Google Analytics
Used by 1 destination(s): google-analytics-4

#### HubSpot API
Used by 1 destination(s): hubspot

#### Intercom API
Used by 1 destination(s): intercom

#### Klaviyo API
Used by 1 destination(s): klaviyo

#### Mixpanel API
Used by 1 destination(s): mixpanel

#### Pinterest API
Used by 1 destination(s): pinterest-conversions

#### Snapchat Marketing API
Used by 1 destination(s): snap-audiences

---

## Recommendations

### High Priority Updates

1. **Salesforce (actions-pardot, salesforce)** - Update from v53.0 to v60.0 to stay within support window
2. **Display & Video 360** - Migrate from v2 to v4 before v2/v3 deprecation
3. **Facebook APIs** - Monitor and update to v22.0 when available for production use

### Regular Maintenance

- **Facebook/Meta APIs**: Update quarterly to stay current (2-year support lifecycle)
- **Google APIs**: Review annually for new versions and deprecation notices
- **Salesforce**: Update at least annually to stay within 3-year support window

### Best Practices

1. Implement version constants for all API integrations
2. Add version checking to CI/CD pipeline
3. Subscribe to API changelog notifications for critical integrations
4. Document API version update procedures
5. Test version updates in staging before production deployment

---

## Destinations with Explicit Version Constants

The following destinations define API versions as constants in their code, making updates easier:

- **actions-pardot**: v5
- **attentive**: v1
- **display-video-360**: v2
- **facebook-conversions-api**: 21.0
- **facebook-custom-audiences**: v21.0
- **first-party-dv360**: v4
- **google-enhanced-conversions**: v21
- **google-sheets**: v4
- **linkedin-audiences**: 202505
- **linkedin-conversions**: 202505
- **marketo-static-lists**: v1
- **ms-bing-ads-audiences**: v13
- **ortto**: v1
- **ortto-audiences**: v1
- **pinterest-conversions**: v5
- **salesforce**: v53.0
- **the-trade-desk-crm**: v3
- **tiktok-audiences**: v1.3
- **vibe-audience**: v1

---

## Destinations Without Explicit Versions

These destinations make API calls but don't specify explicit version numbers:


Total: 117 destinations

- 1plusx (tagger-test.opecloud.com)
- 1plusx-asset-api (us.1plusx.io)
- accoil-analytics (instaging.accoil.com)
- acoustic (api-campaign-${settings.region)
- acoustic-s3tc (${opts.host)
- actable-predictive (api.converscience.com)
- adjust (s2s.adjust.com)
- adobe-target (${this.clientcode)
- airship (docs.airship.com)
- algolia-insights (insights.algolia.io)
- amazon-amc (advertising.amazon.com)
- amazon-conversions-api (advertising-api.amazon.com)
- amazon-eventbridge (null)
- amplitude (api.eu.amplitude.com)
- angler-ai (data.getangler.ai)
- antavo (api.${data.settings.stack)
- apolloio (apollo.io)
- app-fit (api.appfit.io)
- aws-kinesis (aws.amazon.com)
- aws-s3 (docs.aws.amazon.com)

... and 97 more

---

## Appendix: API Deprecation Resources

### Key Documentation Links

- **Facebook Graph API**: https://developers.facebook.com/docs/graph-api/changelog
- **Google Ads API**: https://developers.google.com/google-ads/api/docs/release-notes
- **Google Analytics 4**: https://developers.google.com/analytics/devguides/collection/protocol/ga4
- **HubSpot CRM API**: https://developers.hubspot.com/docs/api/crm/understanding-the-crm
- **Salesforce API**: https://help.salesforce.com/s/articleView?id=000385436
- **SendGrid API**: https://docs.sendgrid.com/api-reference
- **Twilio API**: https://www.twilio.com/docs/api/rest/versions
- **Stripe API**: https://stripe.com/docs/api/versioning
- **Intercom API**: https://developers.intercom.com/docs/build-an-integration/learn-more/rest-apis/api-versioning/

---

## Methodology

This analysis was performed by:

1. Scanning all TypeScript files in destination action directories
2. Extracting HTTP/HTTPS endpoints from API calls
3. Identifying version patterns in URLs and code constants
4. Cross-referencing with known API providers
5. Researching current deprecation status and latest versions
6. Compiling findings into structured report

**Note:** Deprecation status for some APIs requires manual verification against official documentation, as this information changes frequently.

---

*End of Report*
