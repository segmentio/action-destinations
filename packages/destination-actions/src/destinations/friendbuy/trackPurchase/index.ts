import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { commonCustomerFields } from '../shared/commonFields'
import { createPurchasePayload, trackPurchaseFields } from '../shared/sharedPurchase'
import { base64Encode } from '../base64'
import { contextFields } from '../contextFields'
import { trackUrl } from '../cloudUtil'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Purchase',
  description: 'Record when a customer makes a purchase.',
  fields: Object.assign({}, trackPurchaseFields, commonCustomerFields(false), contextFields),

  perform: (request, data) => {
    const friendbuyPayload = createPurchasePayload(data.payload)

    const payload = base64Encode(
      encodeURIComponent(
        JSON.stringify({
          purchase: friendbuyPayload
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
        type: 'purchase',
        merchantId: data.settings.merchantId,
        metadata,
        payload
      }
    })
  }
}

export default action
