import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Bug Bash',
  description: 'No-op action used for bug bash testing.',
  fields: {},
  perform: () => {
    return
  }
}

export default action
