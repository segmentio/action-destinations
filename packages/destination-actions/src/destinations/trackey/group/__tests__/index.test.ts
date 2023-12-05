import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import { baseUrl } from '../../constants'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const timestamp = '2023-02-22T15:21:15.449Z'

describe('Trackey.group', () => {
  it('Sends company data correctly', async () => {
    const event = createTestEvent({
      type: 'group',
      userId: 'test-user-id',
      timestamp,
      groupId: 'test-group-id',
      traits: { 'company-property-1': 'test-value', 'company-property-2': 'test-value-2' }
    })

    nock(baseUrl)
      .post('')
      .reply(202, {
        status: 'SUCCESS',
        data: {
          message: 'Account registered'
        }
      })

    const response = await testDestination.testAction('group', {
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
        message: 'Account registered'
      }
    })
    expect(response.length).toBe(1)
  })
})
