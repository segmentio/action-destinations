import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add to Audience',
  description: 'Add users into an audience',
  fields: {},
  perform: () => {
    return
  }
}

export default action
