import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { fields } from './fields'
import { formatEvent } from './format'
import { sendEvent } from '../client'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Report Website Event',
  description: 'Send a website conversion or custom event to ChatGPT Ads through the Conversions API.',
  fields,
  perform: (request, { settings, payload }) => sendEvent(request, settings, formatEvent(payload))
}

export default action
