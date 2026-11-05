import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { fields } from './fields'
import { sendBatch, sendSingle } from '../functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Conversion',
  description: 'Send a web, app or custom conversion event to the ChatGPT Ads Conversions API.',
  defaultSubscription: 'type = "track"',
  fields,
  perform: (request, { settings, payload }) => sendSingle(request, settings, payload),
  performBatch: (request, { settings, payload }) => sendBatch(request, settings, payload)
}

export default action
