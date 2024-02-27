import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import { API_HOST, API_PATH } from '../../emarsys-helper'
import Destination from '../../index'
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

const regex = new RegExp(`${API_PATH}contactlist/[0-9]+/delete`, 'g')

beforeEach(() => {
  nock.cleanAll()
})

describe('Emarsys.removeFromContactList', () => {
  it('should get an error because of missing key value', async () => {
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
      testDestination.testAction('removeFromContactList', {
        mapping: MODIFIED_PAYLOAD,
        settings: SETTINGS
      })
    ).rejects.toThrowError()
  })

  it('should throw an RetryableError if the API responds with a server error', async () => {
    nock(`${API_HOST}`).post(regex).reply(500, 'Internal server error')
    await expect(
      testDestination.testAction('removeFromContactList', {
        mapping: TESTPAYLOAD,
        settings: SETTINGS
      })
    ).rejects.toThrowError(RetryableError)
  })

  it('should throw an RetryableError if the rate limit was reached', async () => {
    nock(`${API_HOST}`).post(regex).reply(429, 'Too many requests')
    await expect(
      testDestination.testAction('removeFromContactList', {
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
        "deleted_contacts": 1,
        "errors": []
      }
    }`
      )
    await expect(
      testDestination.testAction('removeFromContactList', {
        mapping: TESTPAYLOAD,
        settings: SETTINGS
      })
    ).resolves.not.toThrowError()
  })
})
