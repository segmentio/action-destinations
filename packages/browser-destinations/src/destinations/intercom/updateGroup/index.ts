import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import { Intercom } from '../api'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, Intercom, Payload> = {
  title: 'Group',
  description: '',
  platform: 'web',
  fields: {
    company_id: {
      type: 'string',
      required: true,
      description: "The company ID of the company",
      label: 'Company ID',
      default: {
        '@path': '$.groupId'
      }
    },
    traits: {
      type: 'object',
      required: true,
      description: 'The Segment traits to be forwarded to Intercom',
      label: 'Traits',
      default: {
        '@path': '$.traits'
      }
    },
    name: {
      type: 'string',
      required: true,
      description: "The name of the company",
      label: 'Company Name',
      default: {
        '@path': '$.traits.name'
      }
    },
    plan: {
      type: 'string',
      required: false,
      description: "The name of the plan the company is on",
      label: 'Company Plan',
      default: {
        '@path': '$.traits.plan'
      }
    },
    monthly_spend: {
      label: 'Monthly Spend',
      description: 'How much revenue the company generates for your business',
      required: false,
      type: 'integer',
      default: {
        '@path': '$.traits.monthlySpend'
      }
    },
    created_at: {
      label: 'Created At',
      description: "The time the company was created in your system",
      required: false,
      type: 'datetime',
      default: {
        '@path': '$.traits.createdAt'
      }
    }
  },
  perform: (Intercom, event) => {
    const payload = { ...event.payload }
    console.log(payload.company_id)
    console.log(payload.name)
    console.log(payload.plan)
    console.log(payload.monthly_spend)
    console.log(payload.created_at)
  }
}

export default action
