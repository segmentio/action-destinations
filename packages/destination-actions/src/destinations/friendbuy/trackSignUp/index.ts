import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { createSignUpPayload, trackSignUpFields } from '../shared/sharedSignUp'
import { base64Encode } from '../base64'
import { contextFields } from '../contextFields'
import { trackUrl } from '..'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Sign Up',
  description: 'Record when a customer signs up for a service.',
  fields: Object.assign({}, trackSignUpFields, contextFields),
  perform: (request, data) => {
    const friendbuyPayload = createSignUpPayload(data.payload)

    const payload = base64Encode(
      encodeURIComponent(
        JSON.stringify({
          customer: friendbuyPayload
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
        type: 'sign_up',
        merchantId: data.settings.merchantId,
        metadata,
        payload
      }
    })
  }
}

export default action
