import type { BrowserActionDefinition } from '../../../lib/browser-destinations'

import type { FriendbuyAPI } from '../types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { createFriendbuyPayload, filterFriendbuyAttributes, getName } from '../shared/util'

import { trackCustomerFields } from '../shared/sharedCustomer'

// see https://segment.com/docs/config-api/fql/
export const trackCustomerDefaultSubscription = 'type = "identify"'

const action: BrowserActionDefinition<Settings, FriendbuyAPI, Payload> = {
  title: 'Track Customer',
  description: 'Create a new customer profile or update an existing customer profile.',
  defaultSubscription: trackCustomerDefaultSubscription,
  platform: 'web',
  fields: trackCustomerFields,

  perform: (friendbuyAPI, data) => {
    const friendbuyPayload = createFriendbuyPayload([
      ['id', data.payload.customerId],
      ['email', data.payload.email],
      ['firstName', data.payload.firstName],
      ['lastName', data.payload.lastName],
      ['name', getName(data.payload)],
      ['age', data.payload.age],
      ['customerSince', data.payload.customerSince],
      ['loyaltyStatus', data.payload.loyaltyStatus],
      ['isNewCustomer', data.payload.isNewCustomer],
      // custom properties
      ['anonymousId', data.payload.anonymousId],
      ...filterFriendbuyAttributes(data.payload.friendbuyAttributes)
    ])
    friendbuyAPI.push(['track', 'customer', friendbuyPayload, true])
  }
}

export default action
