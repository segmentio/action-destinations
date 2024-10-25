import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Screeb } from '../types'

const action: BrowserActionDefinition<Settings, Screeb, Payload> = {
  title: 'Group',
  description: 'Set user group and/or attributes.',
  platform: 'web',
  defaultSubscription: 'type = "group"',
  fields: {
    groupId: {
      type: 'string',
      description: 'The group id',
      label: 'Group ID',
      required: true,
      default: { '@path': '$.groupId' }
    },
    groupType: {
      type: 'string',
      description: 'The group type',
      label: 'Group type',
      required: true,
      default: { '@path': '$.traits.group_type' }
    },
    properties: {
      type: 'object',
      label: 'Traits',
      description: 'Traits to associate with the group',
      default: { '@path': '$.traits' }
    }
  },
  perform: (Screeb, event) => {
    const payload = event.payload
    if (!payload || typeof payload !== 'object' || !(payload.groupId || payload.properties)) {
      console.warn(
        '[Screeb] received invalid payload (expected userId, anonymousId, or properties to be present); skipping identify',
        payload
      )
      return
    }

    const properties = payload.properties && Object.keys(payload.properties).length > 0 ? payload.properties : undefined

    Screeb('identity.group.assign', payload.groupType, payload.groupId, properties)
  }
}

export default action
