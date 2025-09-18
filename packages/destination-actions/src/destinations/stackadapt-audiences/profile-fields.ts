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
    key: 'userId',
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
    key: 'firstName',
    label: 'First Name',
    type: 'string',
    description: "The user's first name",
    isPii: true,
  },
  {
    key: 'lastName',
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
    key: 'marketingStatus',
    label: 'Email Marketing Status',
    type: 'string',
    description: 'The email marketing status of the user',
    isPii: false,
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
    key: 'postalCode',
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
    key: 'birthDay',
    label: 'Birth Day',
    type: 'number',
    description: 'The birth day of the user (1-31)',
    isPii: false,
  },
  {
    key: 'birthMonth',
    label: 'Birth Month',
    type: 'number',
    description: 'The birth month of the user (1-12)',
    isPii: false,
  },
  {
    key: 'birthday',
    label: 'Birthday',
    type: 'string',
    description: 'The birthday of the user (ISO date format)',
    isPii: true,
  },
]

// Utility functions to extract data from the configuration
export const getFieldsToMap = (): Set<string> => {
  return new Set(PROFILE_DEFAULT_FIELDS.map(field => field.key))
}

export const getFieldTypes = (): Record<string, string> => {
  return PROFILE_DEFAULT_FIELDS.reduce((acc, field) => {
    acc[field.key] = field.type.toUpperCase()
    return acc
  }, {} as Record<string, string>)
}

export const getFieldProperties = () => {
  return PROFILE_DEFAULT_FIELDS.reduce((acc, field) => {
    acc[field.key] = {
      label: field.label,
      type: field.type as 'string' | 'number' | 'boolean',
      description: field.description
    }
    return acc
  }, {} as Record<string, { label: string; type: 'string' | 'number' | 'boolean'; description: string }>)
}

export const getDefaultMappings = () => {
  const mappings: Record<string, any> = {}
  
  PROFILE_DEFAULT_FIELDS.forEach(field => {
    if (field.key === 'userId') return // Skip userId as it has special handling
    
    // Convert camelCase to snake_case for trait paths
    const traitPath = field.key.replace(/([A-Z])/g, '_$1').toLowerCase()
    
    mappings[field.key] = {
      '@if': {
        exists: { '@path': `$.traits.${traitPath}` },
        then: { '@path': `$.traits.${traitPath}` },
        else: { '@path': `$.context.traits.${traitPath}` }
      }
    }
  })
  
  return mappings
}
