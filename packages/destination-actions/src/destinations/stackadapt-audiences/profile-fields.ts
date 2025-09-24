// Central configuration for StackAdapt profile fields
// This is the single source of truth for all profile field definitions

export interface ProfileFieldConfig {
  key: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'date'
  description: string
  isPii?: boolean
}

export const PROFILE_DEFAULT_FIELDS: ProfileFieldConfig[] = [
  {
    key: 'user_id',
    label: 'User ID',
    type: 'string',
    description: 'The unique identifier for the user',
    isPii: false
  },
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
    key: 'birth_day',
    label: 'Birth Day',
    type: 'number',
    description: 'The birth day of the user (1-31)',
    isPii: false,
  },
  {
    key: 'birth_month',
    label: 'Birth Month',
    type: 'number',
    description: 'The birth month of the user (1-12)',
    isPii: false,
  },
  {
    key: 'birth_year',
    label: 'Birth Year',
    type: 'number',
    description: 'The birth year of the user (YYYY)',
    isPii: false,
  },
  {
    key: 'birth_date',
    label: 'Birth Date',
    type: 'string',
    description: 'The birth date of the user',
    isPii: true,
  },
]

// Utility functions to extract data from the configuration
export const getDefaultFieldsToMap = (): Set<string> => {
  return new Set(PROFILE_DEFAULT_FIELDS.map(field => field.key))
}

export const getDefaultFieldTypes = (): Record<string, string> => {
  return PROFILE_DEFAULT_FIELDS.reduce((acc, field) => {
    acc[field.key] = field.type.toUpperCase()
    return acc
  }, {} as Record<string, string>)
}
