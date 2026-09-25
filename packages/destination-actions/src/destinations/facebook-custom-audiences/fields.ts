import { GlobalSetting } from '@segment/actions-core'

export const adAccountId: GlobalSetting = {
  type: 'string',
  label: 'Advertiser Account ID',
  description: 'Your advertiser account id. Read [more](https://www.facebook.com/business/help/1492627900875762).',
  required: true
}

export const existingAudienceId: GlobalSetting = {
  type: 'string',
  label: 'Existing Audience ID',
  description:
    'Optional. To sync to an audience which already exists in Facebook, paste the Facebook Custom Audience ID here and Segment will connect to that audience instead of creating a new one. The Description and Audience Label settings are ignored when this field is populated. Leave this field blank to create a new Facebook Custom Audience.'
}

export const audienceDescription: GlobalSetting = {
  type: 'string',
  label: 'Description',
  description:
    'A brief description about your audience. Only applies when Segment creates a new audience; ignored when an Existing Audience ID is provided.',
  required: false
}

// Values per Meta's Audience Labels partner integration guide. Meta's public
// Marketing API guide lists the last "Customers" value as CUSTOMERS instead of
// GENERAL_CUSTOMERS - GENERAL_CUSTOMERS confirmed correct via a live v24.0
// createAudience call (STRATCONN-7008), accepted and persisted by the API.
export const audienceLabel: GlobalSetting = {
  type: 'string',
  label: 'Audience Label',
  description:
    "Optionally categorize this audience with one of Meta's predefined labels. Only applies when Segment creates a new audience; ignored when an Existing Audience ID is provided, and a label added here later does not apply to an audience which already exists.",
  required: false,
  choices: [
    { label: 'Qualified Leads', value: 'QUALIFIED_LEADS' },
    { label: 'Disqualified Leads', value: 'DISQUALIFIED_LEADS' },
    { label: 'App Users', value: 'APP_USERS' },
    { label: 'Trial Users', value: 'TRIAL_USERS' },
    { label: 'Engaged Users', value: 'ENGAGED_USERS' },
    { label: 'High Value Customers', value: 'HIGH_VALUE_CUSTOMERS' },
    { label: 'Low Value Customers', value: 'LOW_VALUE_CUSTOMERS' },
    { label: 'At Risk', value: 'AT_RISK' },
    { label: 'Disengaged', value: 'DISENGAGED' },
    { label: 'General Customers', value: 'GENERAL_CUSTOMERS' }
  ]
}
