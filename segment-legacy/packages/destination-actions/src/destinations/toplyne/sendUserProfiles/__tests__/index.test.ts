import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import { baseUrl } from '../../constants'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const timestamp = '2023-02-22T15:21:15.449Z'

describe('Toplyne.sendUserProfiles', () => {
  it('Sends a user profile succesfully succesfully', async () => {
    const event = createTestEvent({
      timestamp,
      type: 'identify',
      userId: 'test-user-id',
      anonymousId: 'test-anonymous-id',
      traits: { 'test-property': 'test-value', 'test-property-2': 'test-value-2' }
    })

    nock(baseUrl)
      .post('/upload/users/profiles')
      .reply(202, {
        status: 'SUCCESS',
        data: {
          message: 'User profiles uploaded.'
        }
      })

    const response = await testDestination.testAction('sendUserProfiles', {
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
        message: 'User profiles uploaded.'
      }
    })
    expect(response.length).toBe(1)
  })
})
