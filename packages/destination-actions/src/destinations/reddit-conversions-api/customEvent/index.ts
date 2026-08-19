import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { send } from '../utils'
import { resolveVersion, sendV3 } from '../v3/utils-v3'
import { LEGACY_API_VERSION, LATEST_API_VERSION } from '../versioning-info'
import {
  event_at,
  custom_event_name,
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
  title: 'Send Custom Event',
  description: 'Send a Custom Conversion Event to Reddit',
  fields: {
    event_at,
    custom_event_name,
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
    return resolveVersion(payload.api_version, features) === LATEST_API_VERSION
      ? sendV3(request, settings, [payload])
      : send(request, settings, [payload])
  },
  performBatch: async (request, { settings, payload, features }) => {
    const v2Payloads = payload.filter((p) => resolveVersion(p.api_version, features) === LEGACY_API_VERSION)
    const v3Payloads = payload.filter((p) => resolveVersion(p.api_version, features) === LATEST_API_VERSION)
    const requests = []
    if (v2Payloads.length) requests.push(send(request, settings, v2Payloads))
    if (v3Payloads.length) requests.push(sendV3(request, settings, v3Payloads))
    return Promise.all(requests)
  }
}

export default action
