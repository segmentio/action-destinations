import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const settings = {
  api_host: 'https://r1-api.dotdigital.com',
  username: 'api_username',
  password: 'api_password'
}

describe('Send transactional Sms', () => {
  it('should send a message', async () => {
    // Mock upsertContact  function
    nock(settings.api_host)
      .post(`/cpaas/messages`)
      .reply(201, { messageId: "10313448-2ef3-449d-a591-6828c5bec55e" })

    const event = createTestEvent({
      type: 'track',
      context: {
        traits: {
          phone: '+441234567890'
        }
      }
    })

    const mapping = {
      to: '$.context.traits.phone',
      message: 'hello world!',
    }

    await expect(
      testDestination.testAction('sendTransactionalSms', {
        event,
        mapping,
        settings
      })
    ).resolves.not.toThrowError()
  })

  it('should send a message with a from name or number', async () => {
    // Mock upsertContact  function
    nock(settings.api_host)
      .post(`/cpaas/messages`)
      .reply(201, { messageId: "10313448-2ef3-449d-a591-6828c3bec55e" })

    const event = createTestEvent({
      type: 'track',
      context: {
        traits: {
          mobileNumber: '+441234567890'
        }
      }
    })

    const mapping = {
      to: '$.context.traits.phone',
      from: 'Segment',
      message: 'hello world!',
    }

    await expect(
      testDestination.testAction('sendTransactionalSms', {
        event,
        mapping,
        settings
      })
    ).resolves.not.toThrowError()
  })
})
