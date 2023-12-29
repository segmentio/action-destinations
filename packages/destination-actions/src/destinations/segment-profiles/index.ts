import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import sendGroup from './sendGroup'

import sendIdentify from './sendIdentify'

import sendSubscription from './sendSubscription'

const destination: DestinationDefinition<Settings> = {
  name: 'Segment Profiles',
  slug: 'actions-segment-profiles',
  mode: 'cloud',
  actions: {
    sendGroup,
    sendIdentify,
    sendSubscription
  }
}

export default destination
