import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { customFields } from '../shared/fields'
import { send, getCustomEventData } from '../shared/functions'
import { EventType } from '../shared/constants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Custom Event V2',
  description: 'Send a custom event',
  syncMode: {
    description: 'Define how the records from your destination will be synced.',
    label: 'How to sync records',
    default: 'add',
    choices: [{ label: 'Insert Records', value: 'add' }]
  },
  fields: customFields,
  perform: (request, { payload, settings, features, statsContext, syncMode }) => {
    if (syncMode === 'add') {
      return send(request, payload, settings, getCustomEventData, EventType.Custom, features, statsContext)
    } else {
      throw new IntegrationError(`Sync mode ${syncMode} is not supported`, 'Misconfigured sync mode', 400)
    }
  }
}

export default action
