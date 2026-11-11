# Adobe AEP (Customer Journey Analytics) Destination: Prospective Setup Guide

Status: **draft, not verified against a live AEP org.** Steps marked *(verify)* come from the blueprint or Adobe docs that we have not run end to end. Do not publish as customer documentation until each *(verify)* item is confirmed in an AEP-enabled sandbox.

Audience: a customer who wants Segment events in Adobe Customer Journey Analytics (CJA) through AEP streaming ingestion.

Sources: [Authenticate and access Experience Platform APIs](https://experienceleague.adobe.com/en/docs/experience-platform/landing/platform-apis/api-authentication), [Send multiple messages in a single HTTP request](https://experienceleague.adobe.com/en/docs/experience-platform/ingestion/tutorials/streaming-multiple-messages), [Create an HTTP API streaming connection](https://experienceleague.adobe.com/en/docs/experience-platform/sources/api-tutorials/create/streaming/http), Adobe's streaming ingestion OpenAPI spec, and `design-spec.md` in this folder.

---

## Overview

| Stage | Where | Result |
|-------|-------|--------|
| 1. Get access | Adobe Admin Console | Developer and product-profile access |
| 2. Create credentials | Adobe Developer Console | Client ID, Client Secret, Organization ID |
| 3. Prepare AEP | Experience Platform | Sandbox, XDM schema, dataset, streaming connection (inlet), dataflow |
| 4. Configure the destination | Segment | Destination settings and a passing connection test |
| 5. Create the first Send Event mapping | Segment | Events flowing into the dataset |
| 6. Verify | Segment and AEP | Records in the dataset, CJA able to read them |

You will collect these values along the way and enter them in Segment:

| Value | Used as | Collected in |
|-------|---------|--------------|
| Organization ID | `imsOrgId` setting | Step 2 |
| Client ID (API key) | `clientId` setting | Step 2 |
| Client Secret | `clientSecret` setting | Step 2 |
| Sandbox name | `sandboxName` setting | Step 3 |
| Inlet (connection) ID | `inletId` setting | Step 3 |
| Schema ID and version | `schemaRefId`, `schemaRefContentType` action fields | Step 3 |
| Dataset ID | `datasetId` action field | Step 3 |
| Dataflow ID | `flowId` action field | Step 3 |

---

## Prerequisites

- An organization licensed for **Adobe Experience Platform**. Without the entitlement, the Experience Platform API cannot be added to a Developer Console project (it appears disabled under Add an API).
- An **Admin Console administrator** who can add you as a developer and as a user on an Experience Platform product profile.
- An **Experience Platform system administrator** who can grant the attribute-based access control (ABAC) permissions needed for write operations.
- An Adobe ID.
- Permission in Segment to add a destination to a source.

---

## Step 1: Get developer and product-profile access

1. Ask your Admin Console administrator to add you as a **developer** and as a **user** on the same Experience Platform product profile. Adobe's default profile is `AEP-Default-All-Users`.
2. Ask your Experience Platform system administrator to grant the ABAC permissions your credential needs to write data (for example to datasets and streaming connections).

## Step 2: Create an OAuth Server-to-Server credential

1. Sign in to [Adobe Developer Console](https://www.adobe.com/go/devs_console_ui). Confirm the organization in the upper-right selector is the one that holds your AEP sandbox.
2. Create an empty project.
3. On the Project Overview screen choose **Add API**, then the Adobe Experience Platform icon, then **Experience Platform API**, then **Next**.
4. Select **OAuth Server-to-Server** and enter a credential name. This is the only supported method for new integrations; JWT is deprecated.
5. Select the product profile (for example `AEP-Default-All-Users`) and choose **Save configured API**.
6. On the OAuth Server-to-Server page, copy:
   - **API key (Client ID)**
   - **Organization ID**
   - **Client Secret** *(verify: Adobe's authentication page names only the API key and Organization ID; confirm where the secret is retrieved)*

Treat the Client Secret as sensitive. Anyone with access to the project can view it.

Access tokens expire every 24 hours. Segment requests and refreshes them, so you do not generate tokens yourself. (You can use **Generate access token** on the same page to test your credential.)

## Step 3: Prepare Experience Platform

Do this in the sandbox that will hold your data.

1. **Note the sandbox name.** Find it in the AEP UI under Sandboxes *(verify the exact navigation)*. It becomes the `sandboxName` setting.
2. **Create an XDM schema for ExperienceEvents**, and note its schema `$id` (for example `https://ns.adobe.com/<tenant>/schemas/<id>`) and version. These become `schemaRefId` and `schemaRefContentType` (for example `application/vnd.adobe.xed-full+json;version=1`). If you plan to keep Adobe Analytics-style reporting, decide whether to use the Analytics ExperienceEvent Full Extension (lift-and-shift) or your own semantic schema *(product decision, open in the blueprint, Q6)*.
3. **Create a dataset** from that schema and note the **dataset ID**. This becomes `datasetId`. Enable it for Real-Time Customer Profile only if you need that, since profile-enabled datasets have different latency and limits.
4. **Create an HTTP API streaming connection (inlet).** Use the Flow Service API, or in the AEP UI go to Sources, then HTTP API.
   - Decide whether the inlet requires authentication. If it does, the OAuth credential from Step 2 is required. If it does not, Segment can still send the token *(verify: whether the credentials are required for unauthenticated inlets, Q10)*.
   - Note the **inlet ID**: the hex ID at the end of the inlet URL (`https://dcs.adobedc.net/collection/<id>`). This becomes `inletId`.
5. **Note the dataflow ID** for the streaming source. This becomes `flowId`. Find it through the Flow Service API or the dataflows list in the AEP UI *(verify the lookup path; also verify whether Adobe enforces `flowId`, since its tutorial example omits it, Q15)*.
6. **Plan for identities.** Events are matched to people through `identityMap`. By default Segment sends `anonymousId` as ECID and `userId` as PID. If you stitch across devices with a custom namespace such as ECI, configure that namespace in AEP Identity Service first (Q7).

## Step 4: Configure the destination in Segment

1. In Segment, add the **Adobe AEP (Customer Journey Analytics)** destination to your source.
2. Enter the settings:

   | Setting | Value |
   |---------|-------|
   | Inlet ID | Hex ID from the inlet URL (Step 3.4) |
   | IMS Org ID | Organization ID (Step 2) |
   | Client ID | API key (Step 2) |
   | Client Secret | Client Secret (Step 2) |
   | Sandbox name | Sandbox that holds the inlet, schema and dataset (Step 3.1) |

3. Save and run the **connection test**. A pass means Segment could obtain a token with your credentials. Whether it also validates the inlet and sandbox is not confirmed yet *(verify)*. If it fails, check that the Organization ID matches the project's organization, that the credential's product profile includes Experience Platform, and that the Client Secret was copied in full.

## Step 5: Create your first Send Event mapping

1. Open the destination's **Mappings** tab and add a **Send Event** mapping. The default subscription is `type = "track" or type = "page" or type = "screen"`. Narrow it (for example to one event name) for a first test.
2. Fill the required fields:

   | Field | Value |
   |-------|-------|
   | Schema ID | Schema `$id` (Step 3.2) |
   | Schema content type | For example `application/vnd.adobe.xed-full+json;version=1` |
   | Dataset ID | Dataset ID (Step 3.3) |
   | Flow ID | Dataflow ID (Step 3.5) |
   | Timestamp | `$.timestamp` (default) |
   | ECID | `$.anonymousId` (default) |
   | PID | `$.userId` (default) |

3. Under **XDM mapping**, add one row per XDM field. The key is the XDM path (dots create nesting) and the value is a Segment field or a constant. Example for an "Order Completed" Track event:

   | XDM path (key) | Value |
   |----------------|-------|
   | `eventType` | `commerce.purchases` (constant) |
   | `commerce.order.purchaseID` | `$.properties.order_id` |
   | `commerce.order.priceTotal` | `$.properties.revenue` |
   | `commerce.order.currencyCode` | `$.properties.currency` |
   | `web.webPageDetails.URL` | `$.context.page.url` |

   Paths must exist in your schema. Custom fields live under your tenant namespace (for example `_acme.plan`). Fields that do not conform to the schema may be dropped silently by AEP *(verify)*. In this first version the paths are typed by hand; there is no autocomplete.
4. Leave batching at its defaults. Segment always batches and keeps each request under Adobe's 1 MB limit.
5. Save the mapping and enable it.

## Step 6: Verify

1. Send a test event from your source, or use Segment's **Event Tester** on the destination.
2. In Segment, check the event's delivery result. Adobe answers each request with HTTP 207 and a result per message, and Segment reports each message individually, so one bad event does not fail the others. A 400 usually means the payload does not match the schema or the schema reference is wrong.
3. In AEP, open the dataset and confirm a new batch with your record. Allow time: Adobe quotes up to 60 minutes to the data lake, and under 15 minutes to Real-Time Customer Profile for profile-enabled datasets.
4. If messages fail, Adobe stores them in an error batch in the dataset. Use Adobe's "retrieving failed batches" guide to read the error.
5. Connect the dataset in **CJA** (a CJA connection and data view). That step happens in Adobe and is outside this destination.

---

## Optional: Send Identify traits (Upsert Profile)

Planned as a later (P1) action, and only needed if you use a separate Profile dataset for enrichment instead of per-event enrichment (Q2). It needs its own Individual Profile schema, dataset, dataflow and possibly a separate inlet (Q4, Q12). Follow Steps 3 and 5 again with the profile schema and dataset, and map `$.traits.*` to Individual Profile XDM paths.

---

## Troubleshooting (expected, to confirm live)

| Symptom | Likely cause |
|---------|--------------|
| Connection test fails | Wrong Organization ID, Client ID or Client Secret; Experience Platform API not added to the project; product profile missing |
| 401 or 403 on events | Token missing or expired on an inlet with authentication enabled; Segment refreshes automatically, so recheck the credential |
| 400 on events | Schema ID or version wrong, dataset's schema differs from the schema reference, or the payload does not match the schema |
| 413 on events | A single event is over 1 MB |
| 429 on events | Throttled by Adobe; Segment retries. Check your entitlement and limits (documented 1,000 requests/sec and 10,000 messages/sec, to confirm with Adobe) |
| Event accepted but fields missing in AEP | XDM path not in the schema, so AEP dropped it |
| Data missing in CJA | Dataset not connected to a CJA connection or data view, or ingestion delay |

---

## Open items before this can become a customer doc

- Confirm every *(verify)* item above in a live AEP sandbox.
- Q10: OAuth token URL and scope, and whether credentials are optional for unauthenticated inlets.
- Q12 and Q15: whether `inletId` and `flowId` are per-destination or per-action, and how customers find `flowId`.
- Add screenshots and exact UI labels once the destination exists in Segment.
