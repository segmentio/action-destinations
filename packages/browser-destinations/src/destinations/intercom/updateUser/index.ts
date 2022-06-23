// import { isObject } from '@segment/actions-core'
import dayjs from 'dayjs'
import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import { Intercom } from '../api'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, Intercom, Payload> = {
  title: 'Update',
  description: '',
  platform: 'web',
  fields: {
    user_id: {
      type: 'string',
      required: false,
      description: "The user's identity",
      label: 'Identity',
      default: {
        '@path': '$.userId'
      }
    },
    traits: {
      type: 'object',
      required: false,
      description: 'The Segment traits to be forwarded to Intercom',
      label: 'Traits',
      default: {
        '@path': '$.traits'
      }
    },
    name: {
      type: 'string',
      required: false,
      description: "User's name",
      label: 'Name',
      default: {
        '@path': '$.traits.name'
      }
    },
    email: {
      type: 'string',
      required: false,
      description: "User's email",
      label: 'Name',
      default: {
        '@path': '$.traits.email'
      }
    },
    created_at: {
      label: 'Created At',
      description: 'A timestamp of when the person was created',
      required: false,
      type: 'datetime',
      default: {
        '@path': '$.traits.createdAt'
      }
    },
    company: {
      label: 'Company',
      description: "The user's company",
      required: false,
      type: 'object',
      default: {
        '@path': '$.traits.company'
      }
    }
  },
  perform: (Intercom, event) => {
    console.log("updateUser")
    const payload = { ...event.payload }

    //change date from ISO-8601 (segment's format) to unix timestamp (intercom's format)
    if (payload.created_at) {
      payload.created_at = dayjs(payload.created_at).unix()
    }

    // //handle company object
    // if(payload.company && isObject(payload.company)){
    //   const company = payload.company

    //   //at the minimum, there must be an id & name
    //   if(!company.company_id || !company.name){
    //     delete payload.company
    //   } else {
    //     if(typeof company.created_at === 'datetime'){
    //       company.created_at = dayjs(company.created_at).unix()
    //     }
    //   }
    // }

    Intercom('update', {
      app_id: Intercom.appId,
      ...payload
    })
  }
}

export default action
