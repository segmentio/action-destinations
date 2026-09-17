import { ActionHookDefinition } from '@segment/actions-core/destination-kit'
import { InputField, DependsOnConditions } from '@segment/actions-core/destination-kit/types'
import type { Settings, AudienceSettings } from '../generated-types'
import type { Payload, RetlOnMappingSaveInputs, RetlOnMappingSaveOutputs } from './generated-types'
import {
  AUDIENCE_TYPE_LABEL,
  CONSENT_STATUS_GRANTED,
  CONSENT_STATUS_DENIED,
  CONTACT_INFO,
  DEVICE_ID
} from './constants'
import { mobileDeviceIds as sharedMobileDeviceIds } from '../properties'

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

const CONTACT_INFO_AUDIENCE: DependsOnConditions = {
  match: 'all',
  conditions: [{ fieldKey: 'audience_type', operator: 'is', value: CONTACT_INFO }]
}

const DEVICE_ID_AUDIENCE: DependsOnConditions = {
  match: 'all',
  conditions: [{ fieldKey: 'audience_type', operator: 'is', value: DEVICE_ID }]
}

const CONTACT_INFO_ONLY =
  'This field is only used when syncing to a Customer Match Contact Info audience. It is ignored when syncing to a Mobile Device ID audience.'

const SEVERAL = 'A single value, or several separated by commas.'

const ADDRESS_GROUP =
  'Zip Code, First Name, Last Name and Country Code must all be provided together. If any of them is missing, none of them are sent, and no error is raised.'

export const audience_type: InputField = {
  label: AUDIENCE_TYPE_LABEL,
  description:
    'The type of Customer Match audience this mapping syncs to. This must match the type of the audience in Display & Video 360, and controls which identifier fields are shown below.',
  type: 'string',
  required: true,
  choices: [
    { label: 'Contact Info', value: CONTACT_INFO },
    { label: 'Mobile Device ID', value: DEVICE_ID }
  ],
  default: CONTACT_INFO
}

export const contact_info: InputField = {
  label: 'Contact Info Details',
  description: `The contact details used to match the user in Display & Video 360. ${CONTACT_INFO_ONLY}`,
  type: 'object',
  depends_on: CONTACT_INFO_AUDIENCE,
  defaultObjectUI: 'keyvalue',
  additionalProperties: false,
  properties: {
    emails: {
      label: 'Emails',
      description: `The user's email address. ${SEVERAL} If not already hashed, the system will hash them before use.`,
      type: 'string',
      category: 'hashedPII'
    },
    phoneNumbers: {
      label: 'Phone Numbers',
      description: `The user's phone number in E.164 format. ${SEVERAL} If not already hashed, the system will hash them before use.`,
      type: 'string',
      category: 'hashedPII'
    },
    zipCodes: {
      label: 'ZIP Codes',
      description: `The user's zip code. ${SEVERAL} ${ADDRESS_GROUP}`,
      type: 'string'
    },
    firstName: {
      label: 'First Name',
      description: `The user's first name. If not already hashed, the system will hash it before use. ${ADDRESS_GROUP}`,
      type: 'string',
      category: 'hashedPII'
    },
    lastName: {
      label: 'Last Name',
      description: `The user's last name. If not already hashed, the system will hash it before use. ${ADDRESS_GROUP}`,
      type: 'string',
      category: 'hashedPII'
    },
    countryCode: {
      label: 'Country Code',
      description: `The user's country code. ${ADDRESS_GROUP}`,
      type: 'string'
    }
  },
  default: {
    emails: {
      '@if': {
        exists: { '@path': '$.context.traits.email' },
        then: { '@path': '$.context.traits.email' },
        else: { '@path': '$.traits.email' }
      }
    },
    phoneNumbers: {
      '@if': {
        exists: { '@path': '$.traits.phone' },
        then: { '@path': '$.traits.phone' },
        else: { '@path': '$.properties.phone' }
      }
    },
    zipCodes: {
      '@if': {
        exists: { '@path': '$.traits.zipCodes' },
        then: { '@path': '$.traits.zipCodes' },
        else: { '@path': '$.properties.zipCodes' }
      }
    },
    firstName: {
      '@if': {
        exists: { '@path': '$.traits.firstName' },
        then: { '@path': '$.traits.firstName' },
        else: { '@path': '$.properties.firstName' }
      }
    },
    lastName: {
      '@if': {
        exists: { '@path': '$.traits.lastName' },
        then: { '@path': '$.traits.lastName' },
        else: { '@path': '$.properties.lastName' }
      }
    },
    countryCode: {
      '@if': {
        exists: { '@path': '$.traits.countryCode' },
        then: { '@path': '$.traits.countryCode' },
        else: { '@path': '$.properties.countryCode' }
      }
    }
  }
}

export const phone_number_settings: InputField = {
  label: 'Phone Number Settings',
  description: `Google rejects phone numbers which do not start with an international country code. For example, +1 for the US or +44 for GB. Segment can add default country codes to phone numbers which are missing a country code. ${CONTACT_INFO_ONLY}`,
  type: 'object',
  defaultObjectUI: 'keyvalue',
  additionalProperties: false,
  properties: {
    defaultCountryCode: {
      label: 'Default Country Code',
      description:
        'The default country to assume for phone numbers. Numbers which already have an international country code are unaffected. This field accepts a two letter code such as US or GB (which would result in +1 or +44 being prefixed).',
      type: 'string'
    },
    useContactInfoCountryCode: {
      label: 'Infer from Contact Info > Country Code',
      description:
        "Use each user's own Country Code, from Contact Info Details, to work out which country their phone number belongs to. Numbers which already have an international country code are unaffected.",
      type: 'boolean'
    }
  },
  default: {
    useContactInfoCountryCode: false
  }
}

export const mobileDeviceIds: InputField = {
  ...sharedMobileDeviceIds,
  depends_on: DEVICE_ID_AUDIENCE,
  description: `A mobile device ID defining a Customer Match audience member. ${SEVERAL} This field is only used when syncing to a Customer Match Mobile Device ID audience. It is ignored when syncing to a Contact Info audience.`
}

const CONSENT_CHOICES = [
  { label: CONSENT_STATUS_GRANTED, value: CONSENT_STATUS_GRANTED },
  { label: CONSENT_STATUS_DENIED, value: CONSENT_STATUS_DENIED }
]

export const consent: InputField = {
  label: 'Consent',
  description:
    'Consent signals for this audience sync. A signal left unset is sent as not specified. Events with consent denied are not sent, as Display & Video 360 rejects any request containing denied consent.',
  type: 'object',
  defaultObjectUI: 'keyvalue',
  additionalProperties: false,
  properties: {
    adUserData: {
      label: 'Ad User Data Consent',
      description: 'Consent to use the data for advertising purposes.',
      type: 'string',
      choices: CONSENT_CHOICES
    },
    adPersonalization: {
      label: 'Ad Personalization Consent',
      description: 'Consent to use the data for ad personalization.',
      type: 'string',
      choices: CONSENT_CHOICES
    }
  }
}

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
  default: ['external_id', 'audience_type', 'consent'],
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
    default: 'create'
  },
  advertiserId: {
    type: 'string',
    label: 'Advertiser ID',
    description:
      'The ID of your advertiser, used throughout Display & Video 360. Use this ID when you contact Display & Video 360 support to help our teams locate your specific account.'
  },
  audienceName: {
    type: 'string',
    label: 'Audience Name',
    description: 'The display name of the audience to create in Display & Video 360.',
    depends_on: CREATE_OPERATION
  },
  audienceType: {
    type: 'string',
    label: AUDIENCE_TYPE_LABEL,
    description: 'The type of the audience to create.',
    choices: [
      { label: 'CUSTOMER MATCH CONTACT INFO', value: CONTACT_INFO },
      { label: 'CUSTOMER MATCH DEVICE ID', value: DEVICE_ID }
    ],
    depends_on: CREATE_OPERATION
  },
  membershipDurationDays: {
    type: 'number',
    label: 'Membership Duration Days',
    description:
      'The duration in days that an entry remains in the audience after the qualifying event. The set value must be greater than 0 and less than or equal to 540.',
    minimum: 1,
    maximum: 540,
    depends_on: CREATE_OPERATION
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
    depends_on: CREATE_DEVICE_ID_OPERATION
  },
  existingAudienceId: {
    type: 'string',
    label: 'Existing Audience ID',
    description: 'The ID of the audience in Display & Video 360 to connect this mapping to.',
    depends_on: EXISTING_OPERATION
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
    label: AUDIENCE_TYPE_LABEL,
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
