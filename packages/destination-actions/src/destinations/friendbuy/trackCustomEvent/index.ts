import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { createCustomEventPayload, trackCustomEventFields } from '../shared/sharedCustomEvent'
import { base64Encode } from '../base64'
import { contextFields } from '../contextFields'
import { trackUrl } from '..'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Custom Event',
  description: 'Record when a customer completes any custom event.',
  fields: Object.assign({}, trackCustomEventFields, contextFields),

  perform: (request, data) => {
    const friendbuyPayload = createCustomEventPayload(data.payload)

    const payload = base64Encode(encodeURIComponent(JSON.stringify(friendbuyPayload)))
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
        type: data.payload.eventName,
        merchantId: data.settings.merchantId,
        metadata,
        payload
      }
    })
  }
}

export default action
