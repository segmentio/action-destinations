import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { createSignUpPayload, trackSignUpFields } from '../shared/sharedSignUp'
import { contextFields } from '../contextFields'
import { createRequestParams, trackUrl } from '../cloudUtil'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Sign Up',
  description: 'Record when a customer signs up for a service.',
  fields: Object.assign({}, trackSignUpFields, contextFields),
  perform: (request, data) => {
    const friendbuyPayload = createSignUpPayload(data.payload)

    const requestParams = createRequestParams(
      'sign_up',
      data.settings.merchantId,
      { customer: friendbuyPayload },
      data.payload
    )

    return request(trackUrl, requestParams)
  }
}

export default action
