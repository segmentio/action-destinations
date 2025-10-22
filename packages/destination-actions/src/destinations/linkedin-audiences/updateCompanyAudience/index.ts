import type { ActionDefinition} from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getSegmentSourceIdAndName, buildJSON, validate } from './functions'
import { send } from '../common-functions'
import { fields } from './fields'
import { SEGMENT_TYPES } from '../constants'
import { LinkedInCompanyAudienceElement } from '../types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync To LinkedIn DMP Company Segment',
  description: 'Syncs an Engage Account based Audience to a LinkedIn DMP Company Segment.',
  defaultSubscription: 'type = "track"',
  fields,
  perform: async (request, { settings, payload, statsContext }) => {
    return send<Payload, LinkedInCompanyAudienceElement>(
      request, 
      getSegmentSourceIdAndName,
      buildJSON,
      validate,
      settings, 
      [payload], 
      SEGMENT_TYPES.COMPANY, 
      false, 
      statsContext
    )
  },
  performBatch: async (request, { settings, payload, statsContext }) => {
    return send<Payload, LinkedInCompanyAudienceElement>(
      request, 
      getSegmentSourceIdAndName,
      buildJSON,
      validate,
      settings, 
      payload, 
      SEGMENT_TYPES.COMPANY, 
      true, 
      statsContext
    )
  }
}

export default action