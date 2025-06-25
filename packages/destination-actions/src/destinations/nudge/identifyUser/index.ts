import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import BaseRequestInterface from '../common/baseRequestInterface'
import { modifyProps, sanitize } from '../common/transforms'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description: 'Identify a user in Nudge',
  defaultSubscription: 'type = "identify"',
  fields: {
    ext_id: {
      label: 'User ID',
      type: 'string',
      description: 'The ID of the user performing the action.',
      required: true,
      default: {
        '@path': '$.userId'
      }
    },
    name: {
      label: 'User Name',
      type: 'string',
      description: 'The name of the user',
      required: false,
      default: {
        '@path': '$.traits.name'
      }
    },
    phone: {
      label: 'Phone Number',
      type: 'string',
      description: 'The phone number of the user',
      required: false,
      default: {
        '@path': '$.traits.phone'
      }
    },
    email: {
      label: 'Email',
      type: 'string',
      description: 'The email of the user.',
      required: false,
      default: {
        '@path': '$.traits.email'
      }
    },
    tz: {
      label: 'Timezone',
      type: 'string',
      description: 'The timezone of the user.',
      required: false,
      default: {
        '@path': '$.context.timezone'
      }
    },
    props: {
      label: 'Properties',
      type: 'object',
      description: 'Properties for the user',
      required: false,
      default: {
        '@path': '$.traits'
      }
    }
  },

  perform: async (request, { settings, payload }) => {
    payload.ext_id = sanitize(payload.ext_id);
    payload.props = modifyProps(payload.props);
    
    return BaseRequestInterface.identify(request, settings, payload)
  }
}

export default action
