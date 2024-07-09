import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { buildPerformer } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'View',
  description: 'Tracks a page view. We recommend including this on every page.',
  defaultSubscription: 'type = "page"',
  fields: {
    url: {
      label: 'URL',
      description: 'The address of the page viewed',
      type: 'string',
      default: { '@path': '$.context.page.url' },
      format: 'uri',
      required: true
    }
  },
  perform: buildPerformer('view')
}

export default action
