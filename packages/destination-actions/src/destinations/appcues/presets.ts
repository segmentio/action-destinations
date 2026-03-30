import type { DestinationDefinition } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import send from './send'

export const presets: DestinationDefinition['presets'] = [
  {
    name: 'Track Calls',
    subscribe: 'type = "track"',
    partnerAction: 'send',
    mapping: defaultValues(send.fields),
    type: 'automatic'
  },
  {
    name: 'Page Calls',
    subscribe: 'type = "page"',
    partnerAction: 'send',
    mapping: defaultValues(send.fields),
    type: 'automatic'
  },
  {
    name: 'Screen Calls',
    subscribe: 'type = "screen"',
    partnerAction: 'send',
    mapping: defaultValues(send.fields),
    type: 'automatic'
  },
  {
    name: 'Identify Calls',
    subscribe: 'type = "identify"',
    partnerAction: 'send',
    mapping: defaultValues(send.fields),
    type: 'automatic'
  },
  {
    name: 'Group Calls',
    subscribe: 'type = "group"',
    partnerAction: 'send',
    mapping: {
      ...defaultValues(send.fields),
      group_traits: {
        '@path': '$.traits'
      }
    },
    type: 'automatic'
  }
]
