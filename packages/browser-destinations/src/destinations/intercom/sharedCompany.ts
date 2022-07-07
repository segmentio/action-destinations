import { InputField } from '@segment/actions-core'

export const extractCompanyProperties = (path: string): Record<string, InputField> => ({
  company_id: {
    type: 'string',
    required: true,
    description: 'The company ID of the company',
    label: 'Company ID'
  },
  name: {
    type: 'string',
    required: true,
    description: 'The name of the company',
    label: 'Company Name',
    default: {
      '@path': `$.${path}.name`
    }
  },
  created_at: {
    label: 'Created At',
    description: 'The time the company was created in your system',
    required: false,
    type: 'datetime',
    default: {
      '@path': `$.${path}.createdAt`
    }
  },
  plan: {
    type: 'string',
    required: false,
    description: 'The name of the plan the company is on',
    label: 'Company Plan',
    default: {
      '@path': `$.${path}.plan`
    }
  },
  monthly_spend: {
    label: 'Monthly Spend',
    description: 'How much revenue the company generates for your business',
    required: false,
    type: 'integer',
    default: {
      '@path': `$.${path}.monthlySpend`
    }
  },
  size: {
    label: 'size',
    description: 'The number of employees in the company',
    required: false,
    type: 'integer',
    default: {
      '@path': `$.${path}.size`
    }
  },
  website: {
    label: 'Website',
    description: 'The URL for the company website',
    required: false,
    type: 'string',
    default: {
      '@path': `$.${path}.website`
    }
  },
  industry: {
    label: 'Industry',
    description: 'The industry of the company',
    required: false,
    type: 'string',
    default: {
      '@path': `$.${path}.industry`
    }
  },
  company_traits: {
    label: 'company traits',
    description: 'the custom traits for the company object',
    required: false,
    type: 'object'
  }
})
