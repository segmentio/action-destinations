import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { commonCustomerFields } from '../shared/commonFields'
import { createPurchasePayload, trackPurchaseFields } from '../shared/sharedPurchase'
import { contextFields } from '../contextFields'
import { createRequestParams, trackUrl } from '../cloudUtil'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Purchase',
  description: 'Record when a customer makes a purchase.',
  fields: Object.assign({}, trackPurchaseFields, commonCustomerFields(false), contextFields),

  perform: (request, data) => {
    const friendbuyPayload = createPurchasePayload(data.payload)

    const requestParams = createRequestParams(
      'purchase',
      data.settings.merchantId,
      { purchase: friendbuyPayload },
      data.payload
    )

    return request(trackUrl, requestParams)
  }
}

export default action
