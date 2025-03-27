import type { DestinationDefinition } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'

import forwardTrackEvent from './forwardTrackEvent'
import forwardIdentifyEvent from './forwardIdentifyEvent'
import forwardGroupEvent from './forwardGroupEvent'

export const presets: DestinationDefinition['presets'] = [
  {
    name: 'Track Events',
    subscribe: 'type = "track"',
    partnerAction: 'forwardTrackEvent',
    mapping: defaultValues(forwardTrackEvent.fields),
    type: 'automatic'
  },
  {
    name: 'Identify Events',
    subscribe: 'type = "identify"',
    partnerAction: 'forwardIdentifyEvent',
    mapping: defaultValues(forwardIdentifyEvent.fields),
    type: 'automatic'
  },
  {
    name: 'Group Events',
    subscribe: 'type = "group"',
    partnerAction: 'forwardGroupEvent',
    mapping: defaultValues(forwardGroupEvent.fields),
    type: 'automatic'
  }
]
