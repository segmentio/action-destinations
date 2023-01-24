import { InputField } from '@segment/actions-core'

export const getCompanyProperties = (): Record<string, InputField> => ({
  company_id: {
    description: 'The unique identifier of the company.',
    label: 'Company ID',
    type: 'string',
    required: true
  },
  name: {
    description: 'The name of the company.',
    label: 'Company Name',
    type: 'string',
    required: true
  },
  created_at: {
    description: 'The time the company was created in your system.',
    label: 'Company Creation Time',
    type: 'datetime',
    required: false
  },
  plan: {
    description: 'The name of the plan you have associated with the company.',
    label: 'Company Plan',
    type: 'string',
    required: false
  },
  monthly_spend: {
    description: 'The monthly spend of the company, e.g. how much revenue the company generates for your business.',
    label: 'Monthly Spend',
    type: 'integer',
    required: false
  },
  size: {
    description: 'The number of employees in the company.',
    label: 'Company Size',
    type: 'integer',
    required: false
  },
  website: {
    description: 'The URL for the company website.',
    label: 'Company Website',
    type: 'string',
    required: false
  },
  industry: {
    description: 'The industry that the company operates in.',
    label: 'Industry',
    type: 'string',
    required: false
  },
  company_custom_traits: {
    description: 'The custom attributes for the company object.',
    label: 'Company Custom Attributes',
    type: 'object',
    required: false,
    defaultObjectUI: 'keyvalue'
  }
})
