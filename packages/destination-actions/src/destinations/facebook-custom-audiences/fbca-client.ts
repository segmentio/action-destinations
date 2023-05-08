import { RequestClient } from '@segment/actions-core'
import { createHash } from 'crypto'

const API_VERSION = 'v16.0'
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`

const hash = (value: string | undefined): string | undefined => {
  if (value === undefined) return

  const hash = createHash('sha256')
  hash.update(value)
  return hash.digest('hex')
}

export default class Facebook {
  request: RequestClient
  accountId: string
  accessToken: string // Testing/PoC only

  constructor(request: RequestClient, accountId: string, accessToken: string) {
    this.request = request
    this.accountId = accountId
    this.accessToken = accessToken
  }

  createAudience = async (name: string) => {
    return this.request(`${BASE_URL}/${this.accountId}/customaudiences`, {
      method: 'POST',
      json: {
        name: name,
        subtype: 'CUSTOM',
        customer_file_source: 'USER_PROVIDED_ONLY'
      },
      headers: {
        authorization: `Bearer ${this.accessToken}`
      }
    })
  }

  updateAudience = async (audienceId: string, schema: string, email: string) => {
    return this.request(`${BASE_URL}/${audienceId}/users`, {
      method: 'POST',
      json: {
        payload: {
          schema: schema,
          data: [hash(email)]
        }
      },
      headers: {
        authorization: `Bearer ${this.accessToken}`
      }
    })
  }

  getAllAudiences = async (accountId: string) => {
    return this.request(`${BASE_URL}/${accountId}/customaudiences?fields=name`, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${this.accessToken}`
      }
    })
  }
}
