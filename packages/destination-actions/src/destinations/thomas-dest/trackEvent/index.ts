import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: '',
  fields: {},
  perform: (request, data) => {
    return request('https://webhook.site/e726bd24-0022-41ca-9442-42813e6c05fe', { method: 'POST', json: data.payload })
  }
}

export default action
