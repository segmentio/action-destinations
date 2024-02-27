import { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import { UpolloClient } from '../types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const identifyUser: BrowserActionDefinition<Settings, UpolloClient, Payload> = {
  title: 'Identify user',
  description: 'Identify the user',
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
    firstName: {
      label: 'First Name',
      description: "The user's given name.",
      type: 'string',
      required: false,
      default: { '@path': '$.traits.firstName' }
    },
    lastName: {
      label: 'Last Name',
      description: "The user's surname.",
      type: 'string',
      required: false,
      default: { '@path': '$.traits.lastName' }
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
  perform: async (UpClient, { payload }) => {
    const userInfo = {
      userId: payload.user_id,
      userEmail: payload.email,
      userPhone: payload.phone,
      userName: payload.name
        ? payload.name
        : payload.firstName || payload.lastName
        ? (payload.firstName + ' ' + payload.lastName).trim()
        : undefined,
      userImage: payload.avatar_image_url,
      customerSuppliedValues: payload.custom_traits ? toCustomValues(payload.custom_traits) : undefined
    }

    void UpClient.track(userInfo)
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
