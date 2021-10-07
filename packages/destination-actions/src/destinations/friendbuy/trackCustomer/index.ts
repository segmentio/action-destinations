import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { trackUrl } from '..'
import { base64Encode } from '../base64'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Customer',
  description: 'Create a customer in Friendbuy or update it if it exists.',
  defaultSubscription: 'type = "identify"', // see https://segment.com/docs/config-api/fql/
  // https://segment.com/docs/connections/spec/identify/
  fields: {
    customerId: {
      label: 'Customer ID',
      description: "The user's customerId.",
      type: 'string',
      required: true,
      default: { '@path': '$.userId' }
    },
    email: {
      label: 'Email',
      description: "The user's email address.",
      type: 'string',
      required: false,
      default: { '@path': '$.traits.email' }
    },
    firstName: {
      label: 'Name',
      description: "The user's given name.",
      type: 'string',
      required: false,
      default: { '@path': '$.traits.firstName' }
    },
    lastName: {
      label: 'Name',
      description: "The user's surname.",
      type: 'string',
      required: false,
      default: { '@path': '$.traits.lastName' }
    },
    name: {
      label: 'Name',
      description: "The user's full name.",
      type: 'string',
      required: false,
      default: { '@path': '$.traits.name' }
    },
    pageUrl: {
      label: 'Page URL',
      description: 'The URL of the web page the event was generated on.',
      type: 'string',
      required: false,
      default: { '@path': '$.context.page.url' }
    },
    pageTitle: {
      label: 'Page Title',
      description: 'The title of the web page the event was generated on.',
      type: 'string',
      required: false,
      default: { '@path': '$.context.page.title' }
    },
    ipAddress: {
      label: 'IP Address',
      description: "The users's IP address.",
      type: 'string',
      required: false,
      default: { '@path': '$.context.ip' }
    },
    profile: {
      label: 'Profile Tracker',
      description: "The user's Friendbuy profile from the browser's local storage, set by friendbuy.js.",
      type: 'string',
      required: false,
      default: { '@path': '$.integrations.Actions Friendbuy.profile' }
    }
  },
  perform: (request, data) => {
    // console.log('request data', JSON.stringify({ request, data }, null, 2))
    const payload = base64Encode(
      encodeURIComponent(
        JSON.stringify({
          customer: {
            id: data.payload.customerId,
            email: data.payload.email,
            firstName: data.payload.firstName,
            lastName: data.payload.lastName,
            name: getName(data.payload)
          }
        })
      )
    )
    const metadata = base64Encode(
      JSON.stringify({
        url: data.payload.pageUrl,
        title: data.payload.pageTitle,
        ipAddress: data.payload.ipAddress
      })
    )
    return request(trackUrl, {
      method: 'get',
      searchParams: {
        type: 'customer',
        merchantId: data.settings.merchantId,
        metadata,
        payload,
        ...(data.payload.profile && { tracker: data.payload.profile })
      }
    })
  }
}

function getName(payload: Payload): string | undefined {
  // prettier-ignore
  return (
    payload.name                           ? payload.name :
    payload.firstName  && payload.lastName ? `${payload.firstName} ${payload.lastName}`
    :                                        undefined
  )
}

export default action
