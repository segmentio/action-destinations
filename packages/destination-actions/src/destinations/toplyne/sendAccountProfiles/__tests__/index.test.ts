import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import { baseUrl } from '../../constants'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const timestamp = '2023-02-22T15:21:15.449Z'

describe('Toplyne.sendAccountProfiles', () => {
  it('Sends an account profile succesfully', async () => {
    const event = createTestEvent({
      timestamp,
      type: 'group',
      groupId: 'test-group-id',
      userId: 'test-user-id',
      traits: { 'test-property': 'test-value', 'test-property-2': 'test-value-2' }
    })

    nock(baseUrl)
      .post('/upload/accounts/profiles')
      .reply(202, {
        status: 'SUCCESS',
        data: {
          message: 'Account profiles uploaded.'
        }
      })

    const response = await testDestination.testAction('sendAccountProfiles', {
      event,
      useDefaultMappings: true,
      settings: {
        apiKey: 'test-api-key'
      }
    })

    expect(response[0].status).toBe(202)
    expect(response[0].data).toMatchObject({
      status: 'SUCCESS',
      data: {
        message: 'Account profiles uploaded.'
      }
    })
    expect(response.length).toBe(1)
  })
})
