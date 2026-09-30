import { ActionHookDefinition } from '@segment/actions-core/destination-kit'
import { InputField, DependsOnConditions } from '@segment/actions-core/destination-kit/types'
import type { Settings, AudienceSettings } from '../generated-types'
import type { Payload, RetlOnMappingSaveInputs, RetlOnMappingSaveOutputs } from './generated-types'
import {
  AUDIENCE_TYPE_LABEL,
  CONSENT_STATUS_GRANTED,
  CONSENT_STATUS_DENIED,
  CONTACT_INFO,
  DEVICE_ID,
  PHONE_NORMALIZATION_NONE,
  PHONE_NORMALIZATION_NORMALIZE,
  PHONE_NORMALIZATION_VALIDATE,
  COUNTRY_CHOICES,
  PHONE_REGION_CHOICES
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

const PHONE_NORMALIZATION_ON: DependsOnConditions = {
  match: 'all',
  conditions: [{ fieldKey: 'normalization', operator: 'is_not', value: PHONE_NORMALIZATION_NONE }]
}

const CONTACT_INFO_ONLY =
  'This field is only used when syncing to a Customer Match Contact Info audience. It is ignored when syncing to a Mobile Device ID audience.'

const SEVERAL = 'A single value, or several separated by commas.'

const ADDRESS_GROUP =
  'Zip Code, First Name, Last Name and Country Code must all be provided together. If any of them is missing, none of them are sent, and no error is raised.'

export const contact_info: InputField = {
  label: 'Contact Info Details',
  description: `The contact details used to match the user in Display & Video 360. ${CONTACT_INFO_ONLY}`,
  type: 'object',
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
      description: `The user's phone number in E.164 format. ${SEVERAL} If not already hashed, the system will hash them before use. Use the 'Phone Number Normalization' settings to have Segment convert numbers to E.164 first.`,
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
      description: `The user's country, as an ISO 3166-1 alpha-2 code. ${ADDRESS_GROUP} It is also used as the country for this user's phone numbers when 'Use Country Code From Contact Info Details' is enabled.`,
      type: 'string',
      choices: COUNTRY_CHOICES
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

export const phone_options: InputField = {
  label: 'Phone Number Normalization',
  description: `How Segment should treat phone numbers before hashing them. Display & Video 360 only matches a phone number hashed from its E.164 form, so a number sent in any other format is silently unmatched. ${CONTACT_INFO_ONLY}`,
  type: 'object',
  defaultObjectUI: 'keyvalue:only',
  additionalProperties: false,
  properties: {
    normalization: {
      label: 'Normalization',
      description:
        "What to do with a phone number which is not already in E.164 format. 'Do not normalize' sends it exactly as mapped. 'Normalize' converts it to E.164 where possible and sends anything it cannot convert unchanged. 'Normalize and validate' also drops numbers which are not valid.",
      type: 'string',
      choices: [
        { label: 'Do not normalize - send the phone number exactly as mapped', value: PHONE_NORMALIZATION_NONE },
        { label: 'Normalize - convert to E.164 where possible', value: PHONE_NORMALIZATION_NORMALIZE },
        {
          label: 'Normalize and validate - convert to E.164 and drop invalid numbers',
          value: PHONE_NORMALIZATION_VALIDATE
        }
      ]
    },
    useContactInfoCountryCode: {
      label: 'Use Country Code From Contact Info Details',
      description:
        "Whether to take the country a user's phone numbers belong to from the Country Code mapped in Contact Info Details. This lets the country vary per user. It is only used for numbers written in a local format, and the Default Country applies whenever it is not populated.",
      type: 'boolean',
      depends_on: PHONE_NORMALIZATION_ON
    },
    defaultCountryCode: {
      label: 'Default Country',
      description:
        'The country these phone numbers belong to, used to convert a number written in a local format. A number starting with + or 00 already states its own country and is converted without this. Without it, a local number cannot be converted, and is sent unchanged or dropped if validation is on.',
      type: 'string',
      choices: PHONE_REGION_CHOICES,
      depends_on: PHONE_NORMALIZATION_ON
    }
  },
  default: {
    normalization: PHONE_NORMALIZATION_NONE,
    useContactInfoCountryCode: false
  }
}

export const mobileDeviceIds: InputField = {
  ...sharedMobileDeviceIds,
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
  default: ['external_id', 'consent'],
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
