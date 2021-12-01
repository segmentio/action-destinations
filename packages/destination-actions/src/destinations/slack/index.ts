import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import postToChannel from './postToChannel'
import pkg from './package.json'

const destination: DestinationDefinition<Settings> = {
  name: 'Slack',
  slug: 'actions-slack',
  version: pkg.version, // Made available on definition so its easy to read
  mode: 'cloud',
  actions: {
    postToChannel
  }
}

export default destination
