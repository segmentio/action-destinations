import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { API_HOST, API_PATH } from '../../emarsys-helper'
import { RetryableError } from '@segment/actions-core'
// import { IntegrationError } from '@segment/actions-core'
// import { RetryableError } from '@segment/actions-core'

const testDestination = createTestIntegration(Destination)

const SETTINGS = {
  api_user: 'testuser001',
  api_password: 'supersecret'
}

const TESTPAYLOAD = {
  key_field: '3',
  key_value: 'tester@emarsys.com',
  write_field: {
    '2': 'Mustermann'
  }
}

beforeEach(() => {
  nock.cleanAll()
})

describe('Emarsys.upsertContact', () => {
  const regex = new RegExp(`${API_PATH}contact/`, 'g')

  it('should get a replyCode=0', async () => {
    nock(`${API_HOST}`)
      .put(regex)
      .reply(
        200,
        `{
      "replyCode": 0,
      "replyText": "OK",
      "data": {
        "id": "766939632"
      }
    }`
      )
    await expect(
      testDestination.testAction('upsertContact', {
        mapping: TESTPAYLOAD,
        settings: SETTINGS
      })
    ).resolves.not.toThrowError()
  })

  it('should get an error because of missing key value', async () => {
    nock(`${API_HOST}`)
      .put(regex)
      .reply(
        200,
        `{
      "replyCode": 0,
      "replyText": "OK",
      "data": {
        "inserted_contacts": 0,
        "errors": {
          "": {
            "2005": "No value provided for key field: 3"
          }
        }
      }
    }`
      )
    const MODIFIED_PAYLOAD = { ...TESTPAYLOAD }
    MODIFIED_PAYLOAD.key_value = ''
    await expect(
      testDestination.testAction('upsertContact', {
        mapping: MODIFIED_PAYLOAD,
        settings: SETTINGS
      })
    ).rejects.toThrowError()
  })

  it('should throw an RetryableError if the API responds with a server error', async () => {
    nock(`${API_HOST}`).put(regex).reply(500, 'Internal server error')
    await expect(
      testDestination.testAction('upsertContact', {
        mapping: TESTPAYLOAD,
        settings: SETTINGS
      })
    ).rejects.toThrowError(RetryableError)
  })

  it('should throw an RetryableError if the rate limit was reached', async () => {
    nock(`${API_HOST}`).put(regex).reply(429, 'Too many requests')
    await expect(
      testDestination.testAction('upsertContact', {
        mapping: TESTPAYLOAD,
        settings: SETTINGS
      })
    ).rejects.toThrowError(RetryableError)
  })
})
