import { InputField } from '@segment/actions-core'
import { ActionHookDefinition } from '@segment/actions-core/destination-kit'
import type { Settings, AudienceSettings } from '../generated-types'
import type { Payload, RetlOnMappingSaveOutputs, RetlOnMappingSaveInputs } from './generated-types'
import { getExistingAudienceIdChoices } from './hook-functions'

export const fields: Record<string, InputField> = {
  externalId: {
    type: 'string',
    required: true,
    label: 'External ID',
    category: 'hashedPII',
    description:
      'Your company’s custom identifier for this user. This can be any unique ID, such as loyalty membership IDs, user IDs, and external cookie IDs.'
  },
  email: {
    type: 'string',
    label: 'Email',
    description: 'User’s email (ex: foo@bar.com)',
    category: 'hashedPII'
  },
  phone: {
    type: 'string',
    label: 'Phone',
    description:
      'User’s phone number, including country code. Punctuation and spaces are ok (ex: 1-234-567-8910 or +44 844 412 4653)',
    category: 'hashedPII'
  },
  birth: {
    type: 'object',
    label: 'Date of Birth',
    description:
      'User’s date of birth. Include as many fields as possible for better match rates (ex: year = YYYY, month = MM, day = DD)',
    properties: {
      year: {
        type: 'string',
        label: 'Year'
      },
      month: {
        type: 'string',
        label: 'Month'
      },
      day: {
        type: 'string',
        label: 'Day'
      }
    },
    category: 'hashedPII'
  },
  name: {
    type: 'object',
    label: 'Name',
    description:
      'User’s name. Include as many fields as possible for better match rates. Use a-z only. No punctuation. Special characters in UTF-8 format',
    category: 'hashedPII',
    properties: {
      first: {
        type: 'string',
        label: 'First Name',
        category: 'hashedPII'
      },
      last: {
        type: 'string',
        label: 'Last Name',
        category: 'hashedPII'
      },
      firstInitial: {
        type: 'string',
        label: 'First Initial'
      }
    }
  },
  gender: {
    type: 'string',
    label: 'Gender',
    description: 'User’s gender (m for male, f for female)',
    category: 'hashedPII'
  },
  city: {
    type: 'string',
    label: 'City',
    description: 'User’s city. Use a-z only. No punctuation. No special characters.',
    category: 'hashedPII'
  },
  state: {
    type: 'string',
    label: 'State',
    description:
      'User’s state. Use the 2-character ANSI abbreviation code, Normalize states outside the US with no punctuation and no special characters.',
    category: 'hashedPII'
  },
  zip: {
    type: 'string',
    label: 'Postal Code',
    description:
      'User’s postal code. For the US, use only the first 5 digits. For the UK, use the Area/District/Sector format.',
    category: 'hashedPII'
  },
  country: {
    type: 'string',
    label: 'Country',
    description: 'User’s country. Use 2-letter country codes in ISO 3166-1 alpha-2 format.',
    category: 'hashedPII'
  },
  mobileAdId: {
    type: 'string',
    label: 'Mobile Advertising ID',
    description:
      'User’s Apple IDFA, Android Ad ID, or Facebook app scoped ID. Keep hyphens (ex: AB1234CD-E123-12FG-J123)',
    category: 'hashedPII'
  },
  appId: {
    type: 'string',
    label: 'App ID',
    description: 'The app ID of the user.',
    category: 'hashedPII'
  },
  pageId: {
    type: 'string',
    label: 'Page ID',
    description: 'The page ID of the user.',
    category: 'hashedPII'
  },
  igAccountIds: {
    type: 'string',
    label: 'Instagram Account IDs',
    description: 'The Instagram account ID of the user.',
    category: 'hashedPII'
  },
  external_audience_id: {
    label: 'Facebook List ID',
    description: `The ID representing the Facebook identifier. This is the identifier that is returned during audience creation.'`,
    type: 'string',
    default: {
      '@path': '$.context.personas.external_audience_id'
    },
    unsafe_hidden: true
  },
  enable_batching: {
    label: 'Enable Batching',
    description: 'Enable batching of requests.',
    type: 'boolean',
    default: true,
    unsafe_hidden: true,
    required: true
  },
  batch_size: {
    label: 'Batch Size',
    description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
    type: 'number',
    default: 10000,
    unsafe_hidden: true,
    required: true
  }, 
  engage_fields: {
    label: 'Engage Audience Fields',
    description: 'Field used for processing an Engage Audience. Segment uses these fields to determine if the payload is generated from an Engage Audience and to extract the necessary information for audience syncing. If these fields are empty the "Sync Mode" field will be used to determine if the payload is from an Engage Audience.',
    type: 'object',
    required: false,
    properties: {
      traits_or_properties: {
        label: 'Traits or Properties',
        description: 'Field used for processing an Engage Audience.',
        type: 'object', 
        required: true
      },
      audience_key: {
        label: 'Segment Audience Key',
        description: 'Field used for processing an Engage Audience.',
        type: 'string',
        required: true
      },
      computation_class: {
        label: 'Segment Computation Action',
        description: "Field used to check if the payload is generated by an Engage Audience. values with 'audience' or 'journey_step' indicate an Engage audience.",
        type: 'string',
        required: true
      }
    }, 
    default: {
      traits_or_properties: {
        '@if': {
          exists: { '@path': '$.traits' },
          then: { '@path': '$.traits' },
          else: { '@path': '$.properties' }
        }
      }, 
      audience_key: {
        '@path': '$.context.personas.computation_key'
      }, 
      computation_class: {
        '@path': '$.context.personas.computation_class'
      }
    } 
  }
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
    label: 'Create a new custom audience or connect to an existing one?',
    description:
      'Choose to either create a new custom audience or use an existing one. If you opt to create a new audience, we will display the required fields for audience creation. If you opt to use an existing audience, a drop-down menu will appear, allowing you to select from all the custom audiences in your ad account.',
    choices: [
      { label: 'Create New Audience', value: 'create' },
      { label: 'Connect to Existing Audience', value: 'existing' }
    ],
    default: 'create'
  },
  audienceName: {
    type: 'string',
    label: 'Audience Creation Name',
    description: 'The name of the audience in Facebook.',
    depends_on: {
      conditions: [
        {
          fieldKey: 'operation',
          operator: 'is',
          value: 'create'
        }
      ]
    }
  },
  existingAudienceId: {
    type: 'string',
    label: 'Existing Audience ID',
    description: 'The ID of the audience in Facebook.',
    depends_on: {
      conditions: [
        {
          fieldKey: 'operation',
          operator: 'is',
          value: 'existing'
        }
      ]
    },
    dynamic: getExistingAudienceIdChoices
  }
}

export const retlHookOutputTypes: ActionHookDefinition<
  Settings,
  Payload,
  AudienceSettings,
  RetlOnMappingSaveInputs,
  RetlOnMappingSaveOutputs
>['outputTypes'] = {
  audienceName: {
    type: 'string',
    label: 'Audience Name',
    description: 'The name of the audience in Facebook this mapping is connected to.',
    required: true
  },
  audienceId: {
    type: 'string',
    label: 'Audience ID',
    description: 'The ID of the audience in Facebook.',
    required: true
  }
}
