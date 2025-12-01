import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { send } from '../events-functions'
import { common_fields } from '../common-fields'
import { common_track_fields } from '../common-track-fields'
import { common_track_identify_fields } from '../common-track-identify-fields'
import { autocapture_fields } from '../autocapture-fields'
import { trackRevenuePerProduct } from './fields'
import { min_id_length } from '../misc-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Log Purchase',
  description: 'Send an event to Amplitude.',
  defaultSubscription: 'type = "track"',
  fields: {
    trackRevenuePerProduct,
    ...common_fields,
    ...common_track_fields,
    ...common_track_identify_fields,
    ...autocapture_fields,
    min_id_length
  },
  perform: (request, { payload, settings }) => {
    return send(request, payload, settings, true)
  }
}

export default action





