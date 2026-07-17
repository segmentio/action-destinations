import { InputField } from '@segment/actions-core'
import { AUDIENCE_ACTION, AUDIENCE_SOURCE } from './constants'

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
      companyDomain: {
        '@if': {
          exists: { '@path': '$.traits.company_domain' },
          then: { '@path': '$.traits.company_domain' },
          else: { '@path': '$.properties.company_domain' }
        }
      },
      linkedInCompanyId: {
        '@if': {
          exists: { '@path': '$.traits.linkedin_company_id' },
          then: { '@path': '$.traits.linkedin_company_id' },
          else: { '@path': '$.properties.linkedin_company_id' }
        }
      }
    }
  },
  dmp_company_action: {
    label: 'Company Segment Action',
    description: 'Whether the company should be added to or removed from the LinkedIn DMP Company Segment.',
    type: 'string',
    required: true,
    choices: [
      { label: 'Add to Company Audience', value: AUDIENCE_ACTION.ADD },
      { label: 'Remove from Company Audience', value: AUDIENCE_ACTION.REMOVE }
    ]
  },
  audience_source: {
    label: 'Audience Source',
    description:
      'Choose "Engage or Reverse ETL" when the Audience is configured in Engage or Reverse ETL. If connecting from a Connections Source, for example a node.js Source, select Connections, then provide a name for your Segment.',
    type: 'string',
    required: true,
    default: AUDIENCE_SOURCE.ENGAGE_RETL,
    choices: [
      { label: 'Engage or Reverse ETL', value: AUDIENCE_SOURCE.ENGAGE_RETL },
      { label: 'Connections', value: AUDIENCE_SOURCE.CONNECTIONS }
    ]
  },
  segment_name: {
    label: 'Segment Name',
    description:
      'The name of the LinkedIn DMP Company Segment to sync to. Used only when Audience Source is "Connections". If a segment with this name does not already exist, it will be created in LinkedIn.',
    type: 'string',
    required: {
      match: 'all',
      conditions: [
        {
          fieldKey: 'audience_source',
          operator: 'is',
          value: AUDIENCE_SOURCE.CONNECTIONS
        }
      ]
    },
    depends_on: {
      match: 'all',
      conditions: [
        {
          fieldKey: 'audience_source',
          operator: 'is',
          value: AUDIENCE_SOURCE.CONNECTIONS
        }
      ]
    }
  },
  computation_key: {
    label: 'Audience Key',
    description:
      'The computation key used to identify the LinkedIn DMP Company Segment. Used only when Audience Source is "Engage or Reverse ETL".',
    type: 'string',
    unsafe_hidden: true,
    required: {
      match: 'all',
      conditions: [
        {
          fieldKey: 'audience_source',
          operator: 'is',
          value: AUDIENCE_SOURCE.ENGAGE_RETL
        }
      ]
    },
    default: {
      '@path': '$.context.personas.computation_key'
    }
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
    default: ['dmp_company_action', 'audience_source', 'segment_name', 'computation_key']
  }
}
