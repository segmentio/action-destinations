import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import addToAudience from './addToAudience'

import removeFromAudience from './removeFromAudience'

const destination: DestinationDefinition<Settings> = {
  name: 'Display and Video 360 (Actions)',
  slug: 'actions-display-video-360',
  mode: 'cloud',
  actions: {
    addToAudience,
    removeFromAudience
  }
}

export default destination
