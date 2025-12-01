import { ActionDefinition} from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { autocapture_fields } from '../fields/autocapture-fields'
import { send } from '../events-functions'
import { common_fields } from '../fields/common-fields'
import { common_track_fields } from '../fields/common-track-fields'
import { common_track_identify_fields } from '../fields/common-track-identify-fields'
import { trackRevenuePerProduct, setOnce, setAlways, add } from './fields'
import { min_id_length } from '../fields/misc-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Log Event V2',
  description: 'Send an event to Amplitude',
  defaultSubscription: 'type = "track"',
  fields: {
    ...common_fields,
    trackRevenuePerProduct,
    setOnce,
    setAlways,
    add,
    ...common_track_fields,
    ...common_track_identify_fields,
    ...autocapture_fields,
    min_id_length
  },
  perform: (request, { payload, settings }) => {
    return send(request, payload, settings, false)
  }
}

export default action
