import nock from 'nock'
// @ts-ignore
import {createTestEvent, createTestIntegration} from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const CLEVERTAP_ACCOUNT_ID = 'test-account-id'
const CLEVERTAP_ACCOUNT_PASSCODE = 'test-account-passcode'
const timestamp = '2021-08-17T15:21:15.449Z'
describe('Clevertap.userUpload', () => {
  it('should validate action fields', async () => {
    const event = createTestEvent({timestamp, event: 'Test Event'})

    nock('https://api.clevertap.com').post('/1/upload').reply(200, {})

    const responses = await testDestination.testAction('userUpload', {
      event,
      useDefaultMappings: true,
      settings: {
        clevertapAccountId: CLEVERTAP_ACCOUNT_ID,
        clevertapPasscode: CLEVERTAP_ACCOUNT_PASSCODE
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    })
  it('should require event field', async () => {
    const event = createTestEvent({ timestamp })
    event.event = undefined

    nock('https://api.clevertap.com').post('/1/upload').reply(200, {})

    try {
      await testDestination.testAction('userUpload', { event, useDefaultMappings: true })
    } catch (e) {
      expect(e.message).toBe("Missing Clevertap Account")
    }
  })

})
