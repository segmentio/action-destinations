import type { ActionDefinition } from '@segment/actions-core'
import dayjs from 'dayjs'
import chunk from 'lodash/chunk'
import { baseUrl } from '../constants'
import { enable_batching } from '../fields'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Account Profiles',
  description: 'Send group calls to Toplyne',
  defaultSubscription: 'type = "group"',
  fields: {
    accountId: {
      type: 'string',
      label: 'Account ID',
      description: 'The ID of the account to send properties for',
      required: true,
      default: { '@path': '$.groupId' }
    },
    creationTime: {
      type: 'datetime',
      label: 'Creation time',
      description: 'Creation time, for segment the event timestamp',
      required: true,
      default: { '@path': '$.timestamp' }
    },
    accountProperties: {
      type: 'object',
      label: 'Account Properties',
      description: 'The properties of the account',
      required: false,
      default: { '@path': '$.traits' }
    },
    enable_batching: enable_batching
  },

  perform: (request, data) => {
    // Send a single account profile
    return request(`${baseUrl}/upload/accounts/profiles`, {
      json: {
        accounts: [
          {
            ...data.payload,
            /**
             * Toplyne API expects a creationTime in Unix time (seconds since epoch)
             */
            creationTime: dayjs(data.payload.creationTime).unix()
          }
        ]
      }
    })
  },

  performBatch: (request, data) => {
    // Send multiple account profiles
    const accountChunks = chunk(data.payload, 100)
    return Promise.all(
      accountChunks.map((accounts) => {
        return request(`${baseUrl}/upload/accounts/profiles`, {
          json: {
            profiles: accounts.map((account) => ({
              ...account,
              /**
               * Toplyne API expects a creationTime in Unix time (seconds since epoch)
               */
              creationTime: dayjs(account.creationTime).unix()
            }))
          }
        })
      })
    )
  }
}

export default action
