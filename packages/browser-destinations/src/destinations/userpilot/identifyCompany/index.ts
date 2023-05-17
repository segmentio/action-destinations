import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Userpilot } from '../types'
// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, Userpilot, Payload> = {
  title: 'Identify Company',
  description: 'Defines an account in Userpilot',
  platform: 'web',
  fields: {
    groupId: {
      type: 'string',
      required: false,
      description: 'Company id',
      label: 'Company ID',
      default: {
        '@path': '$.groupId'
      }
    },
    traits: {
      type: 'object',
      required: false,
      description: 'Segment traits',
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
