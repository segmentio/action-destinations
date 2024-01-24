import nock from 'nock'
import {createTestEvent, createTestIntegration} from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const CLEVERTAP_ACCOUNT_ID = 'test-account-id'
const CLEVERTAP_ACCOUNT_PASSCODE = 'test-account-passcode'
const CLEVERTAP_ACCOUNT_ENDPOINT = 'https://sk1.api.clevertap.com'
describe('Clevertap.userUpload', () => {

  it('should validate action fields', async () => {
    const event = createTestEvent({event: 'Test Event', userId: 'qwqw'})

    nock(CLEVERTAP_ACCOUNT_ENDPOINT).post('/1/upload').reply(200, {})

    const responses = await testDestination.testAction('userUpload', {
      event,
      useDefaultMappings: true,
      settings: {
        clevertapAccountId: CLEVERTAP_ACCOUNT_ID,
        clevertapPasscode: CLEVERTAP_ACCOUNT_PASSCODE,
        clevertapEndpoint: CLEVERTAP_ACCOUNT_ENDPOINT
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

})
