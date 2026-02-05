import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Appcues } from '../types'
import { flatten } from '../functions'
const action: BrowserActionDefinition<Settings, Appcues, Payload> = {
  title: 'Group',
  description: 'Send Segment group events to Appcues.',
  platform: 'web',
  fields: {
    groupId: {
      label: 'Group ID',
      description: 'The ID of the group to identify in Appcues.',
      required: true,
      type: 'string',
      default: { '@path': '$.groupId' }
    },
    traits: {
      label: 'Group traits',
      description: 'Properties to associate with the group / account / company.',
      required: false,
      type: 'object',
      default: { '@path': '$.traits' }
    }
  },
  defaultSubscription: 'type = "group"',
  perform: (appcues, { payload }) => {
    const { groupId, traits } = payload
    const traitsFlattened = flatten(traits || {})
    appcues.group(groupId, traitsFlattened)
  }
}

export default action
