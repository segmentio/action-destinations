import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import sendEmailEvent from './sendEmailEvent'
import sendWebEvent from './sendWebEvent'
import sendTransactionEvent from './sendTransactionEvent'
import sendCustomEvent from './sendCustomEvent'

import dayjs from '../../lib/dayjs'


export const API_URL = "https://api.converscience.com/events"

export function formatTimestampAsUnixSeconds(ISOTimestamp: string | number) {
  return dayjs.utc(ISOTimestamp).unix()
}

const destination: DestinationDefinition<Settings> = {
  name: 'Actable Predictive',
  slug: 'actions-actable-predictive',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      client_id: {
        label: 'Client ID',
        description: 'Your Actable-supplied Client ID.',
        type: 'string',
        required: true
      },
      client_secret: {
        label: 'Client Secret',
        description: 'Your Actable-supplied Client Secret.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request) => {
      return request(API_URL, {
        method: 'post',
        json: { data: [{ stream_key: 'auth' }] }
      })
    }
  },

  extendRequest({ settings }) {
    return {
      headers: { Authorization: Buffer.from(settings.client_id + ':' + settings.client_secret).toString('base64') }
    }
  },

  actions: {
    sendEmailEvent,
    sendWebEvent,
    sendTransactionEvent,
    sendCustomEvent
  }
}

export default destination
