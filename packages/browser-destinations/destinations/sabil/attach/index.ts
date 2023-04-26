import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import Sabil from '../types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, Sabil, Payload> = {
  title: 'Attach',
  description: 'Attach a device to the user.',
  defaultSubscription: 'type = "identify"',
  platform: 'web',
  fields: {
    user_id: {
      type: 'string',
      required: true,
      label: 'User ID',
      description: 'The ID of the user ',
      default: {
        '@path': '$.userId'
      }
    },
    metadata: {
      type: 'object',
      required: false,
      label: 'Metadata',
      description:
        'A key-value object that will be stored alongside the user, device and access records. This will be available to in any webhooks or API calls. Useful if you want to remote logout a device or invalidate a session from the backend via webhook.'
    }
  },
  async perform(sabil, { settings, payload }) {
    if (typeof payload.user_id !== 'string') {
      return
    }
    await sabil.attach({ user: payload.user_id, client_id: settings.client_id, debug: true })
  }
}

export default action
