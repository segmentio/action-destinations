import type { ActionDefinition } from '@segment/actions-core'
import { getEndpointByRegion } from '../common-functions'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { user_id } from '../fields/common-fields'
import { global_user_id } from './fields'
import { min_id_length } from '../fields/misc-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Map User',
  description: 'Merge two users together that would otherwise have different User IDs tracked in Amplitude.',
  defaultSubscription: 'type = "alias"',
  fields: {
    user_id,
    global_user_id,
    min_id_length
  },
  perform: (request, { payload, settings }) => {
    const { min_id_length } = payload
    const options = min_id_length && min_id_length > 0 ? JSON.stringify({ min_id_length }) : undefined
    return request(getEndpointByRegion('usermap', settings.endpoint), {
      method: 'post',
      body: new URLSearchParams({
        api_key: settings.apiKey,
        mapping: JSON.stringify([payload]),
        ...(options && { options })
      })
    })
  }
}

export default action