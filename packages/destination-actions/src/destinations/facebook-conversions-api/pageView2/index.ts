import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { send } from '../functions'
import { pageFields } from '../fields'
import { EventType } from '../constants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Page View V2',
  description: 'Send a page view event when a user lands on a page',
  defaultSubscription: 'type = "page"',
  syncMode: {
    description: 'Define how the records from your destination will be synced.',
    label: 'How to sync records',
    default: 'add',
    choices: [{ label: 'Insert Records', value: 'add' }]
  },
  fields: pageFields,
  perform: (request, { payload, settings, features, statsContext, syncMode }) => {
    if (syncMode === 'add') {
      return send(request, payload, settings, EventType.PageView, features, statsContext)
    } else {
      throw new IntegrationError(`Sync mode ${syncMode} is not supported`, 'Misconfigured sync mode', 400)
    }
  }
}

export default action
