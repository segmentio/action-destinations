import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import { JimoClient } from 'src/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: BrowserActionDefinition<Settings, JimoClient, Payload> = {
  title: 'Send Group Data',
  description: 'Send group ID and traits to Jimo',
  platform: 'web',
  fields: {
    groupId: {
      label: 'Group ID',
      description: 'The unique identifier for the group',
      type: 'string',
      required: true,
      default: {
        '@path': '$.groupId'
      }
    },
    traits: {
      label: 'Group Traits',
      description: 'A list of attributes coming from segment group traits',
      type: 'object',
      required: false,
      default: {
        '@path': '$.traits'
      }
    }
  },
  defaultSubscription: 'type = "group"',
  perform: (jimo, { payload }) => {
    const { groupId, traits } = payload

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    jimo.client().push(['set', 'user:group', [{ groupId, traits: traits ?? {} }, { fromSegment: true }]])
  }
}

export default action
