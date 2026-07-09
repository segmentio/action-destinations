import { InputField } from '@segment/actions-core'
import { AUDIENCE_ACTION } from './constants'

export const fields: Record<string, InputField> = {
  identifiers: {
    label: 'Company Identifiers',
    description:
      "The company identifiers to add to or remove from the LinkedIn DMP Company Segment. At least one of 'Company Domain' or 'LinkedIn Company ID' is required. When both are provided, both are sent to LinkedIn to improve the match rate.",
    type: 'object',
    required: true,
    additionalProperties: false,
    defaultObjectUI: 'keyvalue:only',
    properties: {
      companyDomain: {
        label: 'Company Domain',
        description: "The company's website domain to send to LinkedIn, e.g. 'microsoft.com'.",
        type: 'string'
      },
      linkedInCompanyId: {
        label: 'LinkedIn Company ID',
        description:
          "The company's LinkedIn organization ID or organization URN, e.g. '1035' or 'urn:li:organization:1035'. A bare ID is automatically converted to a URN before being sent to LinkedIn.",
        type: 'string'
      }
    },
    default: {
      companyDomain: { '@path': '$.traits.company_domain' },
      linkedInCompanyId: { '@path': '$.traits.linkedin_company_id' }
    }
  },
  action: {
    label: 'Company Segment Action',
    description: 'Whether the company should be added to or removed from the LinkedIn DMP Company Segment.',
    type: 'string',
    required: true,
    choices: [
      { label: 'Add to Company Audience', value: AUDIENCE_ACTION.ADD },
      { label: 'Remove from Company Audience', value: AUDIENCE_ACTION.REMOVE }
    ]
  },
  enable_batching: {
    label: 'Enable Batching',
    description: 'Enable batching of requests to the LinkedIn DMP Company Segment.',
    type: 'boolean',
    default: true,
    unsafe_hidden: true
  },
  batch_size: {
    label: 'Batch Size',
    description: 'Maximum number of companies to include in each batch. LinkedIn accepts up to 5000 per request.',
    type: 'number',
    default: 5000,
    unsafe_hidden: true
  },
  batch_keys: {
    label: 'Batch Keys',
    description: 'The keys to use for batching the events.',
    type: 'string',
    unsafe_hidden: true,
    required: false,
    multiple: true,
    default: ['action']
  }
}
