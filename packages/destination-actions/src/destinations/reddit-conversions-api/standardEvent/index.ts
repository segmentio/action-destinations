import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { send } from '../utils'
import {
  event_at,
  tracking_type,
  click_id,
  products,
  user,
  data_processing_options,
  screen_dimensions,
  event_metadata,
  conversion_id
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
    conversion_id
  },
  perform: async (request, { settings, payload }) => {
    return await send(request, settings, [payload])
  },
  performBatch: async (request, { settings, payload }) => {
    return await send(request, settings, payload)
  }
}

export default action
