import type { ActionDefinition} from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getSegmentSourceIdAndName, buildJSON, validate } from './functions'
import { send } from '../common-functions'
import { fields } from './fields'
import { SEGMENT_TYPES } from '../constants'
import { LinkedInUserAudienceElement } from '../types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync To LinkedIn DMP User Segment',
  description: 'Syncs an Engage User based Audience to a LinkedIn DMP User Segment.',
  defaultSubscription: 'event = "Audience Entered" or event = "Audience Exited"',
  fields,
  perform: async (request, { settings, payload, statsContext }) => {
    return send<Payload, LinkedInUserAudienceElement>(
      request, 
      getSegmentSourceIdAndName,
      buildJSON,
      validate,
      settings, 
      [payload],  
      SEGMENT_TYPES.USER, 
      false, 
      statsContext
    )
  },
  performBatch: async (request, { settings, payload, statsContext }) => {
    return send<Payload, LinkedInUserAudienceElement>(
      request, 
      getSegmentSourceIdAndName,
      buildJSON,
      validate,
      settings, 
      payload, 
      SEGMENT_TYPES.USER, 
      true, 
      statsContext
    )
  }
}

export default action