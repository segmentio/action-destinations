import { ProfileFieldConfig } from './types' 

export const EXTERNAL_PROVIDER = 'segment_io'

export const GQL_ENDPOINT = 'https://api.stackadapt.com/graphql'

// Central configuration for StackAdapt profile fields
// This is the single source of truth for all profile field definitions
export const PROFILE_DEFAULT_FIELDS: ProfileFieldConfig[] = [
  {
    key: 'email',
    label: 'Email',
    type: 'string',
    description: 'The email address of the user',
    isPii: true,
  },
  {
    key: 'first_name',
    label: 'First Name',
    type: 'string',
    description: "The user's first name",
    isPii: true,
  },
  {
    key: 'last_name',
    label: 'Last Name',
    type: 'string',
    description: "The user's last name",
    isPii: true,
  },
  {
    key: 'phone',
    label: 'Phone',
    type: 'string',
    description: 'The phone number of the user',
    isPii: true,
  },
  {
    key: 'address',
    label: 'Address',
    type: 'string',
    description: 'The address of the user',
    isPii: true,
  },
  {
    key: 'city',
    label: 'City',
    type: 'string',
    description: 'The city of the user',
    isPii: false,
  },
  {
    key: 'state',
    label: 'State',
    type: 'string',
    description: 'The state of the user',
    isPii: false,
  },
  {
    key: 'country',
    label: 'Country',
    type: 'string',
    description: 'The country of the user',
    isPii: false,
  },
  {
    key: 'postal_code',
    label: 'Postal Code',
    type: 'string',
    description: 'The postal code of the user',
    isPii: false,
  },
  {
    key: 'timezone',
    label: 'Timezone',
    type: 'string',
    description: 'The timezone of the user',
    isPii: false,
  },
  {
    key: 'birth_date',
    label: 'Birth Date',
    type: 'date',
    description: 'The birth date of the user',
    isPii: true,
  }
]

export const MAPPING_SCHEMA = [
  {
    incomingKey: 'audienceId',
    destinationKey: 'external_id',
    type: 'string',
    label: 'External Audience ID',
    isPii: false
  },
  {
    incomingKey: 'audienceName',
    destinationKey: 'name',
    type: 'string',
    label: 'External Audience Name',
    isPii: false
  }
]

export const MarketingStatus = {
  OPT_IN: 'Opted-in',
  Indeterminate: 'Indeterminate'
} as const