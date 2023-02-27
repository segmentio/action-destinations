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
  contactlistid: 1234567890,
  key_field: 3,
  key_value: 'tester@emarsys.com'
}

const regex = new RegExp(`${API_PATH}contactlist/-*\\d+/add$`, 'g')

beforeEach(() => {
  nock.cleanAll()
})

describe('Emarsys.addToContactList', () => {
  it('should throw an error if the key_value is empty', async () => {
    nock(`${API_HOST}`)
      .post(regex)
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
      testDestination.testAction('addToContactList', {
        settings: SETTINGS,
        mapping: MODIFIED_PAYLOAD
      })
    ).rejects.toThrowError()
  })

  it('should throw an RetryableError if the API responds with a server error', async () => {
    nock(`${API_HOST}`).post(regex).reply(500, 'Internal server error')
    await expect(
      testDestination.testAction('addToContactList', {
        mapping: TESTPAYLOAD,
        settings: SETTINGS
      })
    ).rejects.toThrowError(RetryableError)
  })

  it('should throw an RetryableError if the rate limit was reached', async () => {
    nock(`${API_HOST}`).post(regex).reply(429, 'Too many requests')
    await expect(
      testDestination.testAction('addToContactList', {
        mapping: TESTPAYLOAD,
        settings: SETTINGS
      })
    ).rejects.toThrowError(RetryableError)
  })

  it('should get a replyCode=0', async () => {
    nock(`${API_HOST}`)
      .post(regex)
      .reply(
        200,
        `{
      "replyCode": 0,
      "replyText": "OK",
      "data": {
        "inserted_contacts": 1,
        "errors": []
      }
    }`
      )
    await expect(
      testDestination.testAction('addToContactList', {
        mapping: TESTPAYLOAD,
        settings: SETTINGS
      })
    ).resolves.not.toThrowError()
  })
})
