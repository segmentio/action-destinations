import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import sendGroup from './sendGroup'
import sendIdentify from './sendIdentify'
import sendSubscription from './sendSubscription'
import sendTrack from './sendTrack'

const destination: DestinationDefinition<Settings> = {
  name: 'Segment Profiles',
  slug: 'actions-segment-profiles',
  mode: 'cloud',
  actions: {
    sendGroup,
    sendIdentify,
    sendSubscription,
    sendTrack
  }
}

export default destination
