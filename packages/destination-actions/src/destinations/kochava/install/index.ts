import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from '../fields'
import { KochavaAction } from '../constants'
import { sendEvent } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Install Notification',
  description: 'Send an app install notification to Kochava for attribution.',
  defaultSubscription: 'type = "track" and event = "Application Installed"',
  fields: {
    ...commonFields,
    ad_services_token: {
      label: 'AdServices Token',
      description: 'iOS 14+ Apple AdServices attribution token.',
      type: 'string',
      required: false
    }
  },
  perform: (request, { payload, settings }) => {
    return sendEvent(request, settings, payload, KochavaAction.Install)
  }
}

export default action
