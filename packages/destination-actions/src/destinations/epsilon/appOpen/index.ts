import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { cachebuster, formId, identifiers } from '../fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'App Open',
  description: 'Sync an App Open events to Epsilon',
  defaultSubscription: 'type = "track" and event = "Application Opened"',
  fields: {
    cachebuster,
    formId,
    identifiers
  },
  perform: (request, data) => {
    // Make your partner api request here!
    // return request('https://example.com', {
    //   method: 'post',
    //   json: data.payload
    // })
  }
}

export default action
