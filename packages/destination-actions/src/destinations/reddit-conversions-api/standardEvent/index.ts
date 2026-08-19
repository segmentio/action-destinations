import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { resolveVersion } from '../utils'
import { sendV2 } from '../utils-v2'
import { sendV3 } from '../utils-v3'
import {
  event_at,
  tracking_type,
  click_id,
  products,
  user,
  data_processing_options,
  screen_dimensions,
  event_metadata,
  conversion_id,
  api_version,
  action_source,
  event_source_url,
  test_id
} from '../fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Standard Event',
  description: 'Send a Standard Conversion Event to Reddit',
  fields: {
    event_at,
    tracking_type,
    click_id,
    products,
    user,
    data_processing_options,
    screen_dimensions,
    event_metadata,
    conversion_id,
    api_version,
    action_source,
    event_source_url,
    test_id
  },
  perform: async (request, { settings, payload, features }) => {
    return resolveVersion(payload.api_version, features) === 'v3'
      ? sendV3(request, settings, [payload])
      : sendV2(request, settings, [payload])
  },
  performBatch: async (request, { settings, payload, features }) => {
    const v2Payloads = payload.filter((p) => resolveVersion(p.api_version, features) === 'v2')
    const v3Payloads = payload.filter((p) => resolveVersion(p.api_version, features) === 'v3')
    const requests = []
    if (v2Payloads.length) requests.push(sendV2(request, settings, v2Payloads))
    if (v3Payloads.length) requests.push(sendV3(request, settings, v3Payloads))
    return Promise.all(requests)
  }
}

export default action
