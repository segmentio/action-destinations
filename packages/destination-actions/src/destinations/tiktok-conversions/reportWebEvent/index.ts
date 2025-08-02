import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { common_fields, new_fields } from './common_fields'
import { travel_fields } from './travel_fields'
import { vehicle_fields } from './vehicle_fields'
import { send } from './utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Report Web Event',
  description:
    'Report Web events directly to TikTok. Data shared can power TikTok solutions like dynamic product ads, custom targeting, campaign optimization and attribution.',
  fields: {
    ...common_fields,
    ...new_fields,
    vehicle_fields,
    travel_fields
  },
  perform: (request, { payload, settings }) => {
    return send(request, settings, payload)
  }
}

export default action
