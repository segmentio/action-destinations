import { BrowserActionDefinition } from 'src/lib/browser-destinations'
import { UpolloClient } from '../types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const identifyUser: BrowserActionDefinition<Settings, UpolloClient, Payload> = {
  title: 'Identify user',
  description: 'Identify the user',
  defaultSubscription: 'type = "identify"',
  platform: 'web',
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
  perform: async (UpClient, { payload, context, settings }) => {
    const userInfo = {
      userId: payload.user_id,
      userEmail: payload.email,
      userPhone: payload.phone,
      userName: payload.name,
      userImage: payload.avatar_image_url,
      customerSuppliedValues: payload.custom_traits ? toCustomValues(payload.custom_traits) : undefined
    }

    const result = await UpClient.assess(userInfo)
    const company = result?.emailAnalysis?.company
    if (company && company?.name != '' && settings?.companyEnrichment) {
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

export default identifyUser

function toCustomValues(values: Record<string, unknown>): Record<string, string> {
  const xs = Object.entries(values)
    .map(([k, v]) => {
      if (typeof v === 'string') {
        return [k, v]
      } else {
        return []
      }
    })
    .filter((xs) => xs.length === 2)

  return Object.fromEntries(xs)
}
