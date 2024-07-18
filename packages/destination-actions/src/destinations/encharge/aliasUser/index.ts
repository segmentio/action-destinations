import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import pick from 'lodash/pick'
import { enchargeIngestAPIURL } from '../utils'
import { commonFields } from '../common-definitions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Alias User',
  description: 'Change the User ID of an user.',
  defaultSubscription: 'type = "alias"',
  fields: {
    userId: {
      type: 'string',
      required: true,
      description: 'The new User ID to associate with the user in Encharge.',
      label: 'User ID',
      default: { '@path': '$.userId' }
    },
    previousUserId: {
      type: 'string',
      required: true,
      description: 'The previous User ID associated with the user in Encharge.',
      label: 'Previous User ID',
      default: { '@path': '$.previousId' }
    },
    ...pick(commonFields, ['timestamp', 'messageId'])
  },
  perform: (request, data) => {
    const payload = {
      ...data.payload,
      type: 'alias'
    }
    return request(enchargeIngestAPIURL, {
      method: 'post',
      json: payload
    })
  }
}

export default action
