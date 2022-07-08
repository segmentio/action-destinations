import { InputField } from '@segment/actions-core'

export const extractCompanyProperties = (): Record<string, InputField> => ({
  company_id: {
    description: 'The company id of the company.',
    label: 'Company Id',
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
    label: 'Created At',
    type: 'datetime',
    required: false
  },
  plan: {
    description: 'The name of the plan the company is on.',
    label: 'Company Plan',
    type: 'string',
    required: false
  },
  monthly_spend: {
    description: 'How much revenue the company generates for your business.',
    label: 'Monthly Spend',
    type: 'integer',
    required: false
  },
  size: {
    description: 'The number of employees in the company.',
    label: 'Size',
    type: 'integer',
    required: false
  },
  website: {
    description: 'The URL for the company website.',
    label: 'Website',
    type: 'string',
    required: false
  },
  industry: {
    description: 'The industry of the company.',
    label: 'Industry',
    type: 'string',
    required: false
  },
  company_custom_traits: {
    description: 'The custom traits for the company object.',
    label: 'Company Custom Traits',
    type: 'object',
    required: false
  }
})
