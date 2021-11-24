import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { createCustomEventPayload, trackCustomEventFields } from '../shared/sharedCustomEvent'
import { contextFields } from '../contextFields'
import { createRequestParams, trackUrl } from '../cloudUtil'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Custom Event',
  description: 'Record when a customer completes any custom event.',
  fields: Object.assign({}, trackCustomEventFields, contextFields),

  perform: (request, data) => {
    const friendbuyPayload = createCustomEventPayload(data.payload)

    const requestParams = createRequestParams(
      data.payload.eventName,
      data.settings.merchantId,
      friendbuyPayload,
      data.payload
    )

    return request(trackUrl, requestParams)
  }
}

export default action
