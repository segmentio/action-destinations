import {  isString } from '@segment/actions-core'
import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import { Intercom } from '../api'
import type { Settings } from '../generated-types'
import { convertISOtoUnix } from '../utils'
import type { Payload } from './generated-types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, Intercom, Payload> = {
  title: 'Update Company',
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
    created_at: {
      label: 'Created At',
      description: "The time the company was created in your system",
      required: false,
      type: 'datetime',
      default: {
        '@path': '$.traits.createdAt'
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
    size: {
      label: 'size',
      description: 'The number of employees in the company',
      required: false,
      type: 'integer',
      default: {
        '@path': '$.traits.size'
      }
    },
    website: {
      label: 'Website',
      description: "The URL for the company website",
      required: false,
      type: 'string',
      default: {
        '@path': '$.traits.website'
      }
    },
    industry: {
      label: 'Industry',
      description: "The industry of the company",
      required: false,
      type: 'string',
      default: {
        '@path': '$.traits.industry'
      }
    }
  },
  perform: (Intercom, event) => {
    const payload : {[k : string] : unknown} = {}
    for(const[key, value] of Object.entries(event.payload)){
      if (key !== "traits"){
        payload[key] = value
      }
    }

    //intercom requires a companyId && companyName
    if(!payload.company_id || !payload.name){
      return
    }

    //change date from ISO-8601 (segment's format) to unix timestamp (intercom's format)
    if(payload.created_at && isString(payload.created_at)){
      payload.created_at = convertISOtoUnix(payload.created_at)
    }

    //filter out reserved fields
    const filteredCustomTraits: {[k: string]: unknown} = {}
    const reservedFields = [...Object.keys(action.fields), "createdAt", "monthlySpend"]
    for(const[key, value] of Object.entries(event.payload.traits)){
      if(!reservedFields.includes(key)){
        filteredCustomTraits[key] = value
      }
    } 
    
    Intercom('update', {
      company: { 
        ...filteredCustomTraits,
        ...payload
      }
    })
  }
}

export default action
