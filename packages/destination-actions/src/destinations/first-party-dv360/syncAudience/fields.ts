import { ActionHookDefinition } from '@segment/actions-core/destination-kit'
import { InputField, DependsOnConditions } from '@segment/actions-core/destination-kit/types'
import type { Settings, AudienceSettings } from '../generated-types'
import type { Payload, RetlOnMappingSaveInputs, RetlOnMappingSaveOutputs } from './generated-types'
import { CONSENT_STATUS_GRANTED, CONSENT_STATUS_DENIED, CONTACT_INFO, DEVICE_ID } from './constants'
import { emails as sharedEmails, phoneNumbers as sharedPhoneNumbers, zipCodes as sharedZipCodes } from '../properties'

const CREATE_OPERATION: DependsOnConditions = {
  match: 'all',
  conditions: [{ fieldKey: 'operation', operator: 'is', value: 'create' }]
}

const EXISTING_OPERATION: DependsOnConditions = {
  match: 'all',
  conditions: [{ fieldKey: 'operation', operator: 'is', value: 'existing' }]
}

const CREATE_DEVICE_ID_OPERATION: DependsOnConditions = {
  match: 'all',
  conditions: [
    { fieldKey: 'operation', operator: 'is', value: 'create' },
    { fieldKey: 'audienceType', operator: 'is', value: DEVICE_ID }
  ]
}

// Display & Video 360 accepts several emails, phone numbers and zip codes for one person, so
// these fields take either a single value or a comma separated list. A comma separated list is
// mostly useful from Reverse ETL, where a column can hold several values.
export const emails: InputField = {
  ...sharedEmails,
  description: `The user's email address, or several separated by commas. If not already hashed, the system will hash them before use.`
}

export const phoneNumbers: InputField = {
  ...sharedPhoneNumbers,
  description: `The user's phone number in E.164 format, or several separated by commas. If not already hashed, the system will hash them before use.`
}

export const zipCodes: InputField = {
  ...sharedZipCodes,
  description: `The user's zip code, or several separated by commas.`
}

export const ad_user_data: InputField = {
  label: 'Ad User Data Consent',
  description:
    'Consent to use the data for advertising purposes. Events with consent denied are not sent to Display & Video 360, as the API rejects any request containing denied consent.',
  type: 'string',
  choices: [
    { label: CONSENT_STATUS_GRANTED, value: CONSENT_STATUS_GRANTED },
    { label: CONSENT_STATUS_DENIED, value: CONSENT_STATUS_DENIED }
  ],
  default: CONSENT_STATUS_GRANTED
}

export const ad_personalization: InputField = {
  label: 'Ad Personalization Consent',
  description:
    'Consent to use the data for ad personalization. Events with consent denied are not sent to Display & Video 360, as the API rejects any request containing denied consent.',
  type: 'string',
  choices: [
    { label: CONSENT_STATUS_GRANTED, value: CONSENT_STATUS_GRANTED },
    { label: CONSENT_STATUS_DENIED, value: CONSENT_STATUS_DENIED }
  ],
  default: CONSENT_STATUS_GRANTED
}

// batch_keys is a reserved field, and its type is narrower than InputField.
export const batch_keys: {
  label: string
  description: string
  type: 'string'
  multiple?: true
  unsafe_hidden?: true
  required?: false
  default?: string[]
} = {
  label: 'Batch Keys',
  description: 'The keys to use for batching the events.',
  type: 'string',
  multiple: true,
  default: ['external_id', 'advertiser_id', 'ad_user_data', 'ad_personalization'],
  unsafe_hidden: true
}

export const retlHookInputFields: ActionHookDefinition<
  Settings,
  Payload,
  AudienceSettings,
  RetlOnMappingSaveInputs,
  RetlOnMappingSaveOutputs
>['inputFields'] = {
  operation: {
    type: 'string',
    label: 'Create a new audience or connect to an existing one?',
    description:
      'Choose to either create a new Customer Match audience in Display & Video 360, or connect to an audience which already exists there.',
    choices: [
      { label: 'Create New Audience', value: 'create' },
      { label: 'Connect to Existing Audience', value: 'existing' }
    ],
    default: 'create',
    required: true
  },
  advertiserId: {
    type: 'string',
    label: 'Advertiser ID',
    description:
      'The ID of your advertiser, used throughout Display & Video 360. Use this ID when you contact Display & Video 360 support to help our teams locate your specific account.',
    required: true
  },
  audienceName: {
    type: 'string',
    label: 'Audience Name',
    description: 'The display name of the audience to create in Display & Video 360.',
    depends_on: CREATE_OPERATION,
    required: CREATE_OPERATION
  },
  audienceType: {
    type: 'string',
    label: 'Audience Type',
    description: 'The type of the audience to create.',
    choices: [
      { label: 'CUSTOMER MATCH CONTACT INFO', value: CONTACT_INFO },
      { label: 'CUSTOMER MATCH DEVICE ID', value: DEVICE_ID }
    ],
    depends_on: CREATE_OPERATION,
    required: CREATE_OPERATION
  },
  membershipDurationDays: {
    type: 'number',
    label: 'Membership Duration Days',
    description:
      'The duration in days that an entry remains in the audience after the qualifying event. The set value must be greater than 0 and less than or equal to 540.',
    minimum: 1,
    maximum: 540,
    depends_on: CREATE_OPERATION,
    required: CREATE_OPERATION
  },
  description: {
    type: 'string',
    label: 'Description',
    description: 'The description of the audience.',
    depends_on: CREATE_OPERATION
  },
  appId: {
    type: 'string',
    label: 'App ID',
    description:
      'The appId matches with the type of the mobileDeviceIds being uploaded. Required for CUSTOMER_MATCH_DEVICE_ID audiences.',
    depends_on: CREATE_OPERATION,
    required: CREATE_DEVICE_ID_OPERATION
  },
  existingAudienceId: {
    type: 'string',
    label: 'Existing Audience ID',
    description: 'The ID of the audience in Display & Video 360 to connect this mapping to.',
    depends_on: EXISTING_OPERATION,
    required: EXISTING_OPERATION
  }
}

export const retlHookOutputTypes: ActionHookDefinition<
  Settings,
  Payload,
  AudienceSettings,
  RetlOnMappingSaveInputs,
  RetlOnMappingSaveOutputs
>['outputTypes'] = {
  audienceId: {
    type: 'string',
    label: 'Audience ID',
    description: 'The ID of the audience in Display & Video 360 this mapping is connected to.',
    required: true
  },
  advertiserId: {
    type: 'string',
    label: 'Advertiser ID',
    description: 'The ID of the advertiser which owns the audience.',
    required: true
  },
  audienceType: {
    type: 'string',
    label: 'Audience Type',
    description: 'The type of the audience in Display & Video 360.',
    required: true
  },
  appId: {
    type: 'string',
    label: 'App ID',
    description: 'The app ID associated with the mobile device IDs in the audience.',
    required: false
  }
}
