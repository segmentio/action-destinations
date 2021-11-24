import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { createCustomerPayload, trackCustomerFields } from '../shared/sharedCustomer'
import { contextFields } from '../contextFields'
import { createRequestParams, trackUrl } from '../cloudUtil'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Customer',
  description: 'Create a new customer profile or update an existing customer profile.',
  fields: Object.assign({}, trackCustomerFields, contextFields),
  perform: (request, data) => {
    // console.log('request data', JSON.stringify(data, null, 2))
    const friendbuyPayload = createCustomerPayload(data.payload)

    const requestParams = createRequestParams(
      'customer',
      data.settings.merchantId,
      { customer: friendbuyPayload },
      data.payload
    )

    return request(trackUrl, requestParams)
  }
}

export default action
