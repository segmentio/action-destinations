import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { API_HOST, API_PATH } from '../../emarsys-helper'
import { IntegrationError } from '@segment/actions-core'
import { RetryableError } from '@segment/actions-core'
// import { IntegrationError } from '@segment/actions-core'
// import { RetryableError } from '@segment/actions-core'

const testDestination = createTestIntegration(Destination)

const SETTINGS = {
  api_user: 'testuser001',
  api_password: 'supersecret'
}

const TESTPAYLOAD = {
  eventid: 100000257,
  key_field: '3',
  key_value: 'tester@emarsys.com',
  event_payload: {
    surname: 'Mustermann'
  }
}

const regex = new RegExp(`${API_PATH}event/[0-9]+/trigger$`, 'g')

beforeEach(() => {
  nock.cleanAll()
})

describe('Emarsys.triggerEvent', () => {
  it('should get a replyCode=0', async () => {
    nock(`${API_HOST}`)
      .post(regex)
      .reply(
        200,
        `{
      "replyCode": 0,
      "replyText": "OK",
      "data": {
        "connectedTo": {
          "email": false,
          "acProgram": false,
          "interactionsProgram": false
        }
      }
    }`
      )
    await expect(
      testDestination.testAction('triggerEvent', {
        mapping: TESTPAYLOAD,
        settings: SETTINGS
      })
    ).resolves.not.toThrowError()
  })

  it('should throw an error because the value in key_field was not found', async () => {
    nock(`${API_HOST}`)
      .post(regex)
      .reply(
        400,
        `{
        "replyCode": 2008,
        "replyText": "No contact found with the external id: 3 - a",
        "data": ""
      }
    `
      )
    await expect(
      testDestination.testAction('triggerEvent', {
        mapping: TESTPAYLOAD,
        settings: SETTINGS
      })
    ).rejects.toThrowError(IntegrationError)
  })

  it('should throw an RetryableError if the API responds with a server error', async () => {
    nock(`${API_HOST}`).post(regex).reply(500, 'Internal server error')
    await expect(
      testDestination.testAction('triggerEvent', {
        mapping: TESTPAYLOAD,
        settings: SETTINGS
      })
    ).rejects.toThrowError(RetryableError)
  })

  it('should throw an RetryableError if the rate limit was reached', async () => {
    nock(`${API_HOST}`).post(regex).reply(429, 'Too many requests')
    await expect(
      testDestination.testAction('triggerEvent', {
        mapping: TESTPAYLOAD,
        settings: SETTINGS
      })
    ).rejects.toThrowError(RetryableError)
  })
})
