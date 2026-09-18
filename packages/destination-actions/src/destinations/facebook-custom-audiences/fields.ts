import { GlobalSetting } from '@segment/actions-core'

export const adAccountId: GlobalSetting = {
  type: 'string',
  label: 'Advertiser Account ID',
  description: 'Your advertiser account id. Read [more](https://www.facebook.com/business/help/1492627900875762).',
  required: true
}

export const operation: GlobalSetting = {
  type: 'string',
  label: 'Create a new custom audience or connect to an existing one?',
  description:
    'Choose to either create a new custom audience or connect to an existing one. If connecting to an existing audience, paste in the Facebook Audience ID you want to connect to in the "Existing Audience ID" field below.',
  choices: [
    { label: 'Create New Audience', value: 'create' },
    { label: 'Connect to Existing Audience', value: 'existing' }
  ],
  default: 'create'
}

export const existingAudienceId: GlobalSetting = {
  type: 'string',
  label: 'Existing Audience ID',
  description: 'The ID of the audience in Facebook',
  depends_on: {
    conditions: [
      {
        fieldKey: 'operation',
        operator: 'is',
        value: 'existing'
      }
    ]
  },
  required: {
    conditions: [
      {
        fieldKey: 'operation',
        operator: 'is',
        value: 'existing'
      }
    ]
  }
}

export const audienceDescription: GlobalSetting = {
  type: 'string',
  label: 'Description',
  description: 'A brief description about your audience.',
  depends_on: {
    conditions: [
      {
        fieldKey: 'operation',
        operator: 'is_not',
        value: 'existing'
      }
    ]
  },
  required: {
    conditions: [
      {
        fieldKey: 'operation',
        operator: 'is_not',
        value: 'existing'
      }
    ]
  }
}

// Values per Meta's Audience Labels partner integration guide. Meta's public
// Marketing API guide lists the last "Customers" value as CUSTOMERS instead of
// GENERAL_CUSTOMERS - GENERAL_CUSTOMERS confirmed correct via a live v24.0
// createAudience call (STRATCONN-7008), accepted and persisted by the API.
export const audienceLabel: GlobalSetting = {
  type: 'string',
  label: 'Audience Label',
  description:
    "Optionally categorize this audience with one of Meta's predefined labels. Sent to Facebook when the audience is created; does not apply retroactively to existing audiences.",
  required: false,
  depends_on: {
    conditions: [
      {
        fieldKey: 'operation',
        operator: 'is_not',
        value: 'existing'
      }
    ]
  },
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
