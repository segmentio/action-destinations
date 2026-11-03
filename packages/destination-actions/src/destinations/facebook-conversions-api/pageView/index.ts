import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { pageFields } from '../shared/fields'
import { send, getPageViewEventData } from '../shared/functions'
import { EventType } from '../shared/constants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Page View',
  description: 'Send a page view event when a user lands on a page',
  defaultSubscription: 'type = "page"',
  fields: pageFields,
  perform: (request, { payload, settings, features, statsContext }) => {
    return send(request, payload, settings, getPageViewEventData, EventType.PageView, features, statsContext)
  }
}

export default action
