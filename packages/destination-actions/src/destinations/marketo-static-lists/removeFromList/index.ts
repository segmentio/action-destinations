import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Remove from List',
  description: 'Remove users from a list',
  fields: {},
  perform: () => {
    return
  }
}

export default action
