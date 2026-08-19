# SEV COMM - INC-SEV3-20022

## COMM DIRECTOR + APPROVALS

Please approve by writing "Approved" in the table below if you are approving that this comms message is accurate.

| Role                       | Primary Contact(s) | Reviewed / Approved? |
| -------------------------- | ------------------ | -------------------- |
| Incident Owner             | Sandeep Kumar      | Reviewed             |
| Product Manager            | [Name]             | [Pending]            |
| Support Team               | [Name]             | [Pending]            |
| Engineering Director       | [Name]             | [Pending]            |
| Communications Coordinator | [Name]             | [Pending]            |

## Incident Context & Resources

| Field                    | Details                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------- |
| Slack Channel            | `#inc-sev3-20022-version-v21-is-deprecated-requests-to-this-version-will-be-block` |
| Incident Management Tool | FireHydrant incident: `inc-sev3-20022`                                             |
| Severity                 | SEV3                                                                               |
| Product Impacted         | Segment Actions Google Enhanced Conversions / Google Ads                           |
| Status                   | Mitigated and resolved on the status page                                          |
| Impact Window            | Approximately `2026-08-05 22:00:00 UTC` to `2026-08-06 17:00:00 UTC`               |
| Affected Customer List   | Google Ads outage impact list                                                      |
| Zendesk Tag              | `sev_incident_20022`                                                               |

## External Advisory

**COMM-INC-SEV3-20022**

**Audience:** Affected Segment workspaces using the Actions Google Enhanced Conversions destination.

**Purpose:** Inform impacted customers of a Google Ads delivery issue, provide details on data impact and remediation, and outline replay/resync next steps where applicable.

**From:** Team Twilio <twilio-notifications@twilio.com>

**Reply to:** Support <support@twilio.com>

**Subject Line:** [SEV 3] Google Enhanced Conversions - Delivery Issue

**Email Preheader:** Segment has resolved a Google Ads delivery issue and is working on replay/resync next steps for affected events where applicable.

### Email Copy

Hello,

We are reaching out to let you know about a data deliverability issue that impacted your workspace `{{workspace-slug}}` between approximately 10:00 p.m. UTC on August 5, 2026 and 5:00 p.m. UTC on August 6, 2026.

During this window, Google Ads rejected a subset of Segment events sent through the Actions Google Enhanced Conversions destination. These rejected events received a non-retryable 400 response from Google Ads, so they were not automatically retried by Segment.

**Status:** This incident has been resolved, and the root cause has been found.

**Root Cause:** Google deprecated version v21 of the Google Ads API and began blocking requests sent to that version. During the incident window, the Segment Actions Google Enhanced Conversions destination sent requests to Google Ads API v21. Google rejected those requests with the following error, resulting in failed event delivery for affected workspaces:

**Error Details:** _"Version v21 is deprecated. Requests to this version will be blocked."_

**What we did / Next Steps:**

1. We updated the Actions Google Enhanced Conversions destination to use Google Ads API v22.
2. We deployed the mitigation across all affected pods and confirmed that Google Ads delivery errors returned to expected levels.
3. We identified affected workspaces and are working through replay/resync options for discarded events where applicable.
4. If your impacted destination is connected to an Engage source, we may require your confirmation before initiating a resync in accordance with Segment's event replay policy.

If you have any additional questions or concerns, please reach out to us by replying directly to this email or opening a ticket via the Console.

We understand how important data reliability is to your business, and we take these issues extremely seriously. We appreciate your business partnership and are committed to continually improving our systems moving forward.

-Team Twilio

## Affected Accounts Index

_This section will dynamically populate with the customer's specific identifiers when sent._

| Affected Account / Workspace ID | Affected Destination                | Impacted Data Type       | Replay / Resync Status        |
| ------------------------------- | ----------------------------------- | ------------------------ | ----------------------------- |
| `{{workspace_slug}}`            | Actions Google Enhanced Conversions | `{{impacted_data_type}}` | `{{replay_or_resync_status}}` |
