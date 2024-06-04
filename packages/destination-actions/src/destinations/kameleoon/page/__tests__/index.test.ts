import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { BASE_URL } from '../../properties'

const SITE_CODE = 'mysitecode'
const VISITOR_CODE = 'visitorCode'
const CLIENT_ID = 'CLIENT_ID'
const CLIENT_SECRET = 'CLIENT_SECRET'

const testDestination = createTestIntegration(Destination)

describe('Kameleoon.page', () => {
  it('should work', async () => {
    nock(BASE_URL).post('').reply(200, {})

    const event = createTestEvent({
      messageId: 'segment-test-message-ez1tp7',
      timestamp: '2024-04-05T12:34:41.713Z',
      type: 'page',
      properties: {
        property1: 1,
        property2: 'test',
        property3: true,
        kameleoonVisitorCode: VISITOR_CODE
      },
      userId: 'test-user-9c06q9',
      name: 'Home Page'
    })
    const apiKey = {
      id: CLIENT_ID,
      secret: CLIENT_SECRET
    }
    const responses = await testDestination.testAction('page', {
      event,
      settings: {
        apiKey: Buffer.from(JSON.stringify(apiKey)).toString('base64'),
        sitecode: SITE_CODE
      },
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })
})
