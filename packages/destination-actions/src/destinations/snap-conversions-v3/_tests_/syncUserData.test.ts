import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

const testIdentifyEvent = createTestEvent({
  timestamp: '2022-05-12T15:21:15.449Z',
  messageId: 'test-message-identify',
  type: 'identify',
  userId: 'user123',
  traits: {
    email: 'test@example.com',
    phone: '+15551234567',
    firstName: 'John',
    lastName: 'Doe',
    address: {
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94105',
      country: 'US'
    }
  }
})

describe('Snap Conversions API - Sync User Data', () => {
  it('should sync user data with UPDATE_PROFILE event name', async () => {
    nock('https://tr.snapchat.com')
      .post('/v3/pixel123/events')
      .query({ access_token: 'access123' })
      .reply(200, { status: 'success' })

    const responses = await testDestination.testAction('syncUserData', {
      event: testIdentifyEvent,
      settings: {
        pixel_id: 'pixel123',
        snap_app_id: 'app123'
      },
      useDefaultMappings: true,
      auth: {
        accessToken: 'access123',
        refreshToken: 'refresh123'
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })
})