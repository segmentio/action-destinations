import { BrowserActionDefinition } from 'src/lib/browser-destinations'
import { UpolloClient } from '../types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { Context } from '@segment/analytics-next'

const identifyUser: BrowserActionDefinition<Settings, UpolloClient, Payload> = {
  title: 'Identify user',
  description: 'Identify the user',
  defaultSubscription: 'type = "identify"',
  platform: 'web',
  fields: {
    event_name: {
      description: 'The name of the event.',
      label: 'Event Name',
      type: 'string',
      required: false,
      default: {
        '@path': '$.event'
      }
    },
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
  perform: (UpClient, { context, payload }) => {
    console.log('perform identify', context, payload)
    const userInfo = {
      userId: payload.user_id,
      userEmail: payload.email,
      userPhone: payload.phone,
      userName: payload.name,
      userImage: payload.avatar_image_url,
      customerSuppliedValues: payload.custom_traits ? toCustomValues(payload.custom_traits) : undefined
    }
    const e = segmentEventToUw(context)
    console.log('calling up.track', UpClient, userInfo, e)
    try {
      void UpClient.track(userInfo, e)
    } catch (e) {
      console.error('error calling track', e)
    }
  }
}

export default identifyUser

const eventMapping = new Map<String, number>([
  ['Signed Up', 19],
  ['Signed In', 18],
  ['Signed Up', 19],
  ['Signed In', 18],
  ['Account Added User', 9],
  ['Trial Started', 14],
  ['Trial Ended', 15]
])

function segmentEventToUw(ctx: Context): number | undefined {
  return ctx.event.event ? eventMapping.get(ctx.event.event) : undefined
}

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
