import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { viewContentFields } from '../fields'
import { send } from '../functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'View Content',
  description: 'Send event when a user views content or a product',
  defaultSubscription: 'type = "track" and event = "Product Viewed"',
  fields: viewContentFields,
  perform: (request, { payload, settings, features, statsContext }) => {
    return send(request, payload, settings, features, statsContext)
  }
}

export default action
