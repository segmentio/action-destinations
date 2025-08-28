# Runbook: TikTok Audiences Destination Missing `externalId` Issue

## Problem Identified

The payloads to the TikTok Audiences destination are missing the `externalId` field, which prevents successful audience syncing.

## Root Cause

- The TikTok Audiences destination expects an `external_audience_id` parameter in the event payload.
- This ID is sourced from `$.context.personas.external_audience_id` by default.
- When this field is missing from the event context, audience syncing will fail.

## Solution Steps

1. **Verify External Audience ID Configuration**

   - The TikTok Audiences destination requires `external_audience_id` for both `addToAudience` and `removeFromAudience` actions.
   - This ID should be automatically populated from the Engage context data path: `$.context.personas.external_audience_id`.

2. **Troubleshoot Missing ID**

   - Check if you're using a legacy or native TikTok Audiences destination instance.
   - **For legacy instances (created before September 25th, 2023):**
     - Ensure you've completed the "Create a TikTok Audience" step.
     - Verify the `audience_id` obtained was properly added to your mappings.
   - **For native instances:**
     - Verify that the audience was properly connected to the destination.
     - Check that the "Send Track" option is enabled and the "Send Identify" option is disabled.

3. **Validate Settings & Requirements**

   - Ensure you have provided the Advertiser ID linked to your TikTok account.
   - Verify that at least one identifier (email, phone, or advertising ID) is being sent.
   - Confirm TikTok API access is properly authenticated via OAuth.

4. **Fix Implementation**

   - **If using legacy instances:** Check mappings in both "Add Users" and "Remove Users" configurations.
   - **If using native instances:** Ensure correct configuration in the "Add to Audience" and "Remove from Audience" mappings.
   - Validate that the event names match what's configured in the mappings (default is "Audience Entered" and "Audience Exited").

5. **Monitor & Verify**
   - After implementing fixes, check the TikTok Ads Manager (`Assets > Audiences`) to verify audience creation.
   - Note that it can take 24-48 hours for users to appear in TikTok.

## Additional Notes

- TikTok requires phone numbers to be formatted in E.164 form (e.g., `+1231234567`).
- TikTok requires a minimum audience size of 1,000 to target Custom Audiences in an ad group.
- If you need to update from legacy to native instances, contact friends@segment.com.
