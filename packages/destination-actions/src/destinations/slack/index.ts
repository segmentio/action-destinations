import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import postToChannel from './postToChannel'

const destination: DestinationDefinition<Settings> = {
  name: 'Slack',
  actions: {
    postToChannel
  }
}

export default destination
