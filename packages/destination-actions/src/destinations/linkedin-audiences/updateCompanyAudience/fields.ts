import { InputField } from '@segment/actions-core'
import { AUDIENCE_ACTION, AUDIENCE_SOURCE, MAX_INDUSTRIES } from './constants'

export const fields: Record<string, InputField> = {
  identifiers: {
    label: 'Company Identifiers',
    description:
      "The company identifiers to add to or remove from the LinkedIn DMP Company Segment. At least one of 'Company Name', 'Company Domain', 'Company Email Domain', 'LinkedIn Company ID' or 'LinkedIn Company Page URL' is required. When more than one is provided, all of them are sent to LinkedIn to improve the match rate.",
    type: 'object',
    required: true,
    additionalProperties: false,
    defaultObjectUI: 'keyvalue:only',
    properties: {
      companyName: {
        label: 'Company Name',
        description: "The company's name to send to LinkedIn, e.g. 'Microsoft'.",
        type: 'string'
      },
      companyDomain: {
        label: 'Company Domain',
        description: "The company's website domain to send to LinkedIn, e.g. 'microsoft.com'.",
        type: 'string'
      },
      companyEmailDomain: {
        label: 'Company Email Domain',
        description:
          "The company's email domain, which is sometimes different from its website domain, e.g. 'microsoft.com'. If a full email address is provided, only the domain part is sent.",
        type: 'string'
      },
      linkedInCompanyId: {
        label: 'LinkedIn Company ID',
        description:
          "The company's LinkedIn organization ID or organization URN, e.g. '1035' or 'urn:li:organization:1035'. A bare ID is automatically converted to a URN before being sent to LinkedIn.",
        type: 'string'
      },
      companyPageUrl: {
        label: 'LinkedIn Company Page URL',
        description:
          "The company's LinkedIn page URL, e.g. 'linkedin.com/company/microsoft'. Values longer than 100 characters are not sent, as LinkedIn rejects them.",
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
  send_company_traits: {
    label: 'Send Company Traits',
    description:
      'Send additional company details, such as city and country, to help LinkedIn match the company. Leave this off when syncing a user-based Engage Audience: several users can belong to the same company, their profiles can disagree on these details, and only one of them is sent. Which one is not stable, so the values sent may change between syncs.',
    type: 'boolean',
    default: false,
    required: false
  },
  company_traits: {
    label: 'Company Traits',
    description:
      'Additional company details sent to LinkedIn to help it match the company. Only used when "Send Company Traits" is enabled. A value that breaches a LinkedIn length or format limit is left out of the request rather than shortened.',
    type: 'object',
    required: false,
    additionalProperties: false,
    defaultObjectUI: 'keyvalue:only',
    depends_on: {
      match: 'all',
      conditions: [
        {
          fieldKey: 'send_company_traits',
          operator: 'is',
          value: true
        }
      ]
    },
    properties: {
      industries: {
        label: 'Industries',
        description: `The company's industries, as free text. Accepts either a list or a single comma-separated value, e.g. 'software, technology'. LinkedIn accepts at most ${MAX_INDUSTRIES}; any beyond that are not sent. Entries longer than 50 characters are not sent.`,
        type: 'string',
        multiple: true
      },
      city: {
        label: 'City',
        description: "The company's city, e.g. 'Seattle'. Values longer than 50 characters are not sent.",
        type: 'string'
      },
      state: {
        label: 'State or Province',
        description: "The company's state or province, e.g. 'WA'. Values longer than 50 characters are not sent.",
        type: 'string'
      },
      country: {
        label: 'Country',
        description:
          "The company's country as a two-letter ISO 3166-1 alpha-2 code, e.g. 'US' or 'DE'. Lowercase codes are accepted and upper-cased. A country name, or a code that is not an ISO one, is not sent. Note the code for the United Kingdom is 'GB', not 'UK'.",
        type: 'string'
      },
      postalCode: {
        label: 'Postal Code',
        description: "The company's postal code, e.g. '98101'. Values longer than 20 characters are not sent.",
        type: 'string'
      },
      stockSymbol: {
        label: 'Stock Symbol',
        description: "The company's stock ticker symbol, e.g. 'MSFT'. Values longer than 5 characters are not sent.",
        type: 'string'
      }
    }
  },
  dmp_company_action: {
    label: 'Company Segment Action',
    description: 'Whether the company should be added to or removed from the LinkedIn DMP Company Segment.',
    type: 'string',
    required: true,
    choices: [
      { label: 'Add to Company Segment', value: AUDIENCE_ACTION.ADD },
      { label: 'Remove from Company Segment', value: AUDIENCE_ACTION.REMOVE }
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
