import type { DestinationDefinition, Preset } from '@segment/actions-core'
import type { Settings } from './generated-types'
import postToChannel from './postToChannel'

const destination: DestinationDefinition<Settings> = {
  name: 'Slack',
  slug: 'actions-slack',
  mode: 'cloud',
  // TEMPORARY bug-bash (Row 59, scratch): isolated repro on a clean destination.
  // A preset with NO type field, pointing at the real postToChannel action.
  // Expect CP to default type -> 'automatic'. Never merge.
  presets: [
    {
      name: 'Missing Type Preset',
      partnerAction: 'postToChannel',
      subscribe: 'type = "track"',
      mapping: {}
    } as unknown as Preset
  ],
  actions: {
    postToChannel
  }
}

export default destination
