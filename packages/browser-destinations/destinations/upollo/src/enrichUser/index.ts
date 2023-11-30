import { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import { UpolloClient } from '../types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const enrichUser: BrowserActionDefinition<Settings, UpolloClient, Payload> = {
  title: 'Enrich user',
  description: 'Enrich the user',
  defaultSubscription: 'type = "identify"',
  platform: 'web',
  lifecycleHook: 'enrichment',
  fields: {
    user_id: {
      type: 'string',
      required: false,
      label: 'User ID',
      description: 'The ID of the user ',
      default: {
        '@path': '$.userId'
      }
    },
    name: {
      description: "The user's name.",
      label: 'Name',
      type: 'string',
      required: false,
      default: {
        '@path': '$.traits.name'
      }
    },
    email: {
      description: "The user's email address.",
      label: 'Email Address',
      type: 'string',
      required: false,
      default: {
        '@path': '$.traits.email'
      }
    },
    phone: {
      description: "The user's phone number.",
      label: 'Phone Number',
      type: 'string',
      required: false,
      default: {
        '@path': '$.traits.phone'
      }
    },
    avatar_image_url: {
      description: "The URL for the user's avatar/profile image.",
      label: 'Avatar',
      type: 'string',
      required: false,
      default: { '@path': '$.traits.avatar' }
    },
    custom_traits: {
      description: "The user's custom attributes.",
      label: 'Custom Attributes',
      type: 'object',
      required: false,
      defaultObjectUI: 'keyvalue'
    }
  },
  perform: async (UpClient, { payload, context }) => {
    if (payload?.email) {
      const result = await UpClient.checkEmail(payload?.email)
      if (result && result?.company?.name != '') {
        const company = result?.company
        if (company && company?.name != '') {
          const size = company.companySize
          const count = size && Math.max(size.employeesMin, size.employeesMax)
          const companyInfo = {
            name: company?.name,
            industry: company?.industry,
            employee_count: count
          }
          context.updateEvent('traits.company', companyInfo)
        }
      }
    }
  }
}

export default enrichUser
