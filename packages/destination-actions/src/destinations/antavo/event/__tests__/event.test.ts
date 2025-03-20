import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import destination from '../../index'

const testDestination = createTestIntegration(destination)
const settings = {
  stack: 'test-stack',
  api_key: 'testApiKey',
  api_secret: 'testApiSecret'
}

describe('Antavo (Actions)', () => {
  beforeEach((done) => {
    nock.cleanAll()
    nock.abortPendingRequests()
    done()
  })

  describe('event', () => {
    it('Handle request with default mappings', async () => {
      nock(`https://api.${settings.stack}.antavo.com`)
        .post('/v1/webhook/segment')
        .reply(202, {})

      const event = createTestEvent({
        type: 'track',
        userId: 'testUser',
        properties: {
          antavoAction: 'testAction',
          antavoAccount: 'testAccount',
          points: 1234
        }
      })

      const responses = await testDestination.testAction(
        'event', {
          event,
          settings,
          mapping: {
            customer: { '@path': '$.userId' },
            action: { '@path': '$.properties.antavoAction' },
            account: { '@path': '$.properties.antavoAccount' },
            data: {
              points: { '@path': '$.properties.points' }
            }
          }
        })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(202)
      expect(responses[0].options.json).toMatchObject({
        customer: 'testUser',
        action: 'testAction',
        account: 'testAccount',
        data: {
          points: 1234
        }
      })
    })
    it('Handle request without default mappings', async () => {
      nock(`https://api.${settings.stack}.antavo.com`)
        .post('/v1/webhook/segment')
        .reply(202, {})

      const event = createTestEvent({
        type: 'track',
        properties: {
          antavoUserId: 'testUser',
          antavoAction: 'testAction',
          antavoAccount: 'testAccount',
          points: 1234
        }
      })

      const responses = await testDestination.testAction(
        'event', {
          event,
          settings,
          mapping: {
            customer: { '@path': '$.properties.antavoUserId' },
            action: { '@path': '$.properties.antavoAction' },
            account: { '@path': '$.properties.antavoAccount' },
            data: {
              points: { '@path': '$.properties.points' }
            }
          }
        })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(202)
      expect(responses[0].options.json).toMatchObject({
        customer: 'testUser',
        action: 'testAction',
        account: 'testAccount',
        data: {
          points: 1234
        }
      })
    })
    it('Handle request without optional fields', async () => {
      nock(`https://api.${settings.stack}.antavo.com`)
        .post('/v1/webhook/segment')
        .reply(202, {})

      const event = createTestEvent({
        type: 'track',
        userId: 'testUser',
        properties: {
          antavoAction: 'testAction'
        }
      })

      const responses = await testDestination.testAction(
        'event', {
          event,
          settings,
          mapping: {
            customer: { '@path': '$.userId' },
            action: { '@path': '$.properties.antavoAction' }
          }
        })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(202)
      expect(responses[0].options.json).toMatchObject({
        customer: 'testUser',
        action: 'testAction'
      })
    })
    it('Throw error for missing required field: customer', async () => {
      nock(`https://api.${settings.stack}.antavo.com`)
        .post('/v1/webhook/segment')
        .reply(202, {})

      const event = createTestEvent({
        type: 'track',
        userId: 'testUser',
        properties: {
          antavoAction: 'testAction',
          antavoAccount: 'testAccount',
          points: 1234
        }
      })

      await expect(testDestination.testAction(
        'event', {
          event,
          settings,
          mapping: {
            customer: '',
            action: { '@path': '$.properties.antavoAction' },
            account: { '@path': '$.properties.antavoAccount' },
            data: {
              points: { '@path': '$.properties.points' }
            }
          }
        })
      ).rejects.toThrowError('The root value is missing the required field \'customer\'.')
    })
    it('Throw error for missing required field: action', async () => {
      nock(`https://api.${settings.stack}.antavo.com`)
        .post('/v1/webhook/segment')
        .reply(202, {})

      const event = createTestEvent({
        type: 'track',
        userId: 'testUser',
        properties: {
          antavoAction: 'testAction',
          antavoAccount: 'testAccount',
          points: 1234
        }
      })

      await expect(testDestination.testAction(
        'event', {
          event,
          settings,
          mapping: {
            customer: { '@path': '$.userId' },
            action: '',
            account: { '@path': '$.properties.antavoAccount' },
            data: {
              points: { '@path': '$.properties.points' }
            }
          }
        })
      ).rejects.toThrowError('The root value is missing the required field \'action\'.')
    })
  })
})
