import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import {
  filterFriendbuyAttributes,
  getName
} from '../../../../../../packages/browser-destinations/src/destinations/friendbuy/util'
import { trackCustomerFields } from '../../../../../../packages/browser-destinations/src/destinations/friendbuy/trackCustomer'
import { base64Encode } from '../base64'
import { contextFields } from '../contextFields'
import { trackUrl } from '..'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Customer',
  description: 'Create a new customer profile or update an existing customer profile.',
  fields: Object.assign({}, trackCustomerFields, contextFields),
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
            name: getName(data.payload),
            age: data.payload.age,
            customerSince: data.payload.customerSince,
            loyaltyStatus: data.payload.loyaltyStatus,
            isNewCustomer: data.payload.isNewCustomer,
            anonymousId: data.payload.anonymousId,
            ...filterFriendbuyAttributes(data.payload.friendbuyAttributes)
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
        payload
        // ...(data.payload.profile && { tracker: data.payload.profile })
      },
      headers: pickDefined({
        // fbt-proxy validates the profile.domain against the Referer header.
        Referer: data.payload.pageUrl,
        'User-Agent': data.payload.userAgent,
        'X-Forwarded-For': data.payload.ipAddress
      })
    })
  }
}

function pickDefined<T>(obj: Record<string, T>): Record<string, NonNullable<T>> {
  const result: Record<string, NonNullable<T>> = {}
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      result[key] = value as NonNullable<T>
    }
  })
  return result
}

export default action
