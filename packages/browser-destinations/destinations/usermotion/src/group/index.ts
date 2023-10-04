import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { UserMotion } from '../types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, UserMotion, Payload> = {
  title: 'Identify Company',
  description: 'Create or update a company in UserMotion',
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
  perform: (UserMotion, event) => {
    const { groupId, traits } = event.payload
    if (!groupId) return

    const props = typeof traits === 'object' ? { ...traits } : undefined
    UserMotion.group(groupId, props)
  }
}

export default action
