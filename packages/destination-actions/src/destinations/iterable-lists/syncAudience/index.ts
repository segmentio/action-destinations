import { ActionDefinition } from '@segment/actions-core'
import type { AudienceSettings, Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { fields } from './fields'
import { send } from './functions'

const action: ActionDefinition<Settings, Payload, AudienceSettings> = {
  title: 'Sync To Iterable Lists',
  description: 'Sync Segment Audience to Iterable Lists',
  fields,
  perform: (request, { payload, settings, audienceSettings }) => {
    return send(request, [payload], settings, false, audienceSettings)
  },
  performBatch: (request, { payload, settings, audienceSettings }) => {
    return send(request, payload, settings, true, audienceSettings)
  }
}



export default action
