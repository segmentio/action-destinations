import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Userpilot } from '../types'
// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, Userpilot, Payload> = {
  title: 'Identify Company',
  description: 'Create or update a company entity in Userpilot',
  platform: 'web',
  defaultSubscription: 'type = "group"',
  fields: {
    groupId: {
      type: 'string',
      required: true,
      description: 'The ID of the company.',
      label: 'Company ID',
      default: {
        '@path': '$.groupId'
      }
    },
    traits: {
      type: 'object',
      required: false,
      description: 'Company traits',
      label: 'Traits',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (_, events) => {
    window.userpilot.group(events.payload.groupId ?? '', events.payload.traits ?? {})
  }
}

export default action
