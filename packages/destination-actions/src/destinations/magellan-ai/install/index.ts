import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { buildPerformer } from '../utils'
import { mobileFields } from '../schema'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Install',
  description: 'Fire this event to track when a user installs your mobile application. (Mobile applications only)',
  defaultSubscription: 'type = "track" and event = "Application Installed"',
  fields: mobileFields,
  perform: buildPerformer('install')
}

export default action
