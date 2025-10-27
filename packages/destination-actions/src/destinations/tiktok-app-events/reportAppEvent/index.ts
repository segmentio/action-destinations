import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { common_fields } from './fields/common_fields'
import { send } from './utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Report App Event',
  description:
    'Report App events directly to TikTok. Data shared can power TikTok solutions like dynamic product ads, custom targeting, campaign optimization and attribution.',
  fields: {
    ...common_fields
  },
  perform: (request, { payload }) => {
    return send(request, payload)
  }
}

export default action
