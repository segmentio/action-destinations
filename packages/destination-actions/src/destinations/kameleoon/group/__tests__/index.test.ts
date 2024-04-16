import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { BASE_URL } from '../../properties'

const SITE_CODE = 'mysitecode'
const VISITOR_CODE = 'visitorCode'
const CLIENT_ID = 'CLIENT_ID'
const CLIENT_SECRET = 'CLIENT_SECRET'

const testDestination = createTestIntegration(Destination)

describe('Kameleoon.group', () => {
  it('should work', async () => {
    nock(BASE_URL).post('').reply(200, {})

    const event = createTestEvent({
      messageId: 'segment-test-message-3lbg5r',
      timestamp: '2024-04-05T12:39:11.592Z',
      type: 'group',
      traits: {
        trait1: 1,
        trait2: 'test',
        trait3: true,
        kameleoonVisitorCode: VISITOR_CODE
      },
      groupId: 'test-group-m03by',
      userId: 'test-user-s1245h'
    })
    const apiKey = {
      id: CLIENT_ID,
      secret: CLIENT_SECRET
    }
    const responses = await testDestination.testAction('group', {
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
