import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../../index'

const testDestination = createTestIntegration(Definition)

describe('Dawn Analytics - Identify User', () => {
  beforeEach(() => {
    nock.disableNetConnect()
  })

  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  describe('identifyUser action', () => {
    it('should correctly send payload to Dawn API', async () => {
      const payload = {
        user_id: 'test-user-id',
        traits: { name: 'John Doe', email: 'john@example.com' }
      }

      nock('https://api.dawnai.com')
        .post('/segment-identify', [
          {
            user_id: 'test-user-id',
            traits: { name: 'John Doe', email: 'john@example.com' }
          }
        ])
        .matchHeader('authorization', 'Bearer test-write-key')
        .reply(200, { success: true })

      const event = await testDestination.testAction('identifyUser', {
        settings: { writeKey: 'test-write-key' },
        mapping: payload,
        useDefaultMappings: true
      })

      expect(event[0].content).toEqual('{"success":true}')
    })

    it('should handle missing traits', async () => {
      const payload = {
        user_id: 'test-user-id'
      }

      nock('https://api.dawnai.com')
        .post('/segment-identify', [
          {
            user_id: 'test-user-id',
            traits: {}
          }
        ])
        .matchHeader('authorization', 'Bearer test-write-key')
        .reply(200, { success: true })

      const event = await testDestination.testAction('identifyUser', {
        settings: { writeKey: 'test-write-key' },
        mapping: payload,
        useDefaultMappings: true
      })

      expect(event[0].content).toEqual('{"success":true}')
    })
  })

  describe('action definition', () => {
    it('should have required user_id field', () => {
      expect(Definition.actions.identifyUser.fields.user_id).toBeDefined()
      expect(Definition.actions.identifyUser.fields.user_id.required).toBe(true)
      expect(Definition.actions.identifyUser.fields.user_id.type).toBe('string')
    })

    it('should have optional traits field', () => {
      expect(Definition.actions.identifyUser.fields.traits).toBeDefined()
      expect(Definition.actions.identifyUser.fields.traits.required).toBe(false)
      expect(Definition.actions.identifyUser.fields.traits.type).toBe('object')
    })
  })
})
