import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Mixpanel } from '../types'

const action: BrowserActionDefinition<Settings, Mixpanel, Payload> = {
  title: 'Identify',
  description: 'Sync user profile data to Mixpanel.',
  defaultSubscription: 'type = "identify"',
  platform: 'web',
  fields: {
    alias: {
      label: 'Alias ID',
      description: 'The new ID to associate with the user.',
      type: 'string',
      required: true,
      allowNull: false,
      default: { '@path': '$.userId' }
    },
    original: {
      label: 'Original ID',
      description: 'The original ID to associate with the user.',
      type: 'string',
      required: true,
      allowNull: false,
      default: { '@path': '$.previousId' }
    }
  },
  perform: (mixpanel, { payload }) => {
    const { alias, original } = payload
    mixpanel.alias(alias, original)
  }
}

export default action
