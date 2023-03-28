import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import pick from 'lodash/pick'
import { enchargeRestAPIBase } from '../utils'
import { commonFields } from '../common-definitions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Tag User',
  description: 'Add a tag to a user in Encharge.',
  fields: {
    tag: {
      type: 'string',
      required: true,
      description: 'The tags to add, separated by commas.',
      label: 'Tag',
      default: { '@path': '$.traits.tag' }
    },
    ...pick(commonFields, ['email', 'userId', 'segmentAnonymousId'])
  },
  perform: (request, data) => {
    if (!data.payload.email && !data.payload.userId && !data.payload.segmentAnonymousId) {
      throw new PayloadValidationError('No user ID, email, or anonymous ID provided.')
    }
    if (!data.payload.tag?.length) {
      throw new PayloadValidationError('Missing tag.')
    }
    return request(`${enchargeRestAPIBase}/v1/tags`, {
      method: 'post',
      json: data.payload
    })
  }
}

export default action
