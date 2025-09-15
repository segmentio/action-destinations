import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { Survicate } from 'src/types'

const action: BrowserActionDefinition<Settings, Survicate, Payload> = {
  title: 'Identify Group',
  description: 'Send group traits to Survicate',
  defaultSubscription: 'type = "group"',
  platform: 'web',
  fields: {
    groupId: {
      type: 'string',
      required: true,
      description: 'The Segment groupId to be forwarded to Survicate',
      label: 'Group ID',
      default: {
        '@path': '$.groupId'
      }
    },
    traits: {
      type: 'object',
      required: true,
      description: 'The Segment traits to be forwarded to Survicate',
      label: 'Traits',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (_, { payload }) => {
    const groupTraits = Object.fromEntries(
      Object.entries(payload.traits).map(([key, value]) => [`group_${key}`, value])
    )
    window._sva.setVisitorTraits({ groupId: payload.groupId, ...groupTraits })
  }
}

export default action
