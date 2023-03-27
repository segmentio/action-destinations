import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import airQuality from './airQuality'

import weather from './weather'

import pollen from './pollen'

const destination: DestinationDefinition<Settings> = {
  name: 'Ambee Apis',
  slug: 'actions-ambee-apis',
  mode: 'cloud',
  actions: {
    airQuality,
    weather,
    pollen
  }
}

export default destination
