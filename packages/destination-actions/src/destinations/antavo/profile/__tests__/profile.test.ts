import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import destination from '../../index'

const testDestination = createTestIntegration(destination)
const settings = {
  stack: 'test-stack',
  api_key: 'testApiKey'
}

describe('Antavo (Actions)', () => {
  beforeEach((done) => {
    nock.cleanAll()
    nock.abortPendingRequests()
    done()
  })

  describe('profile', () => {
    it('Handle request with default mappings', async () => {
      nock(`https://api.${settings.stack}.antavo.com`)
        .post('/v1/webhook/segment')
        .reply(202, {})

      const event = createTestEvent({
        type: 'identify',
        userId: 'testUser',
        traits: {
          antavoAccount: 'testAccount',
          first_name: 'testFirstName',
          last_name: 'testLastName',
          email: 'test@test.com',
          birth_date: '1900-01-01',
          gender: 'testGender',
          language: 'testLanguage',
          phone: 123456,
          mobile_phone: 654321
        }
      })

      const responses = await testDestination.testAction(
        'profile', {
          event,
          settings,
          mapping: {
            customer: { '@path': '$.userId' },
            account: { '@path': '$.traits.antavoAccount' },
            data: {
              first_name: { '@path': '$.traits.first_name' },
              last_name: { '@path': '$.traits.last_name' },
              email: { '@path': '$.traits.email' },
              birth_date: { '@path': '$.traits.birth_date' },
              gender: { '@path': '$.traits.gender' },
              language: { '@path': '$.traits.language' },
              phone: { '@path': '$.traits.phone' },
              mobile_phone: { '@path': '$.traits.mobile_phone' }
            }
          }
        })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(202)
      expect(responses[0].options.json).toMatchObject({
        customer: 'testUser',
        account: 'testAccount',
        data: {
          first_name: 'testFirstName',
          last_name: 'testLastName',
          email: 'test@test.com',
          birth_date: '1900-01-01',
          gender: 'testGender',
          language: 'testLanguage',
          phone: '123456',
          mobile_phone: '654321'
        },
        action: 'profile',
        api_key: 'testApiKey'
      })
    })
    it('Handle request without default mappings', async () => {
      nock(`https://api.${settings.stack}.antavo.com`)
        .post('/v1/webhook/segment')
        .reply(202, {})

      const event = createTestEvent({
        type: 'identify',
        userId: 'testUser',
        traits: {
          antavoAccount: 'testAccount',
          antavoFirstName: 'testFirstName',
          antavoLastName: 'testLastName',
          antavoEmail: 'test@test.com',
          antavoBirthDate: '1900-01-01',
          antavoGender: 'testGender',
          antavoLanguage: 'testLanguage',
          antavoPhone: 123456,
          antavoMobilePhone: 654321
        }
      })

      const responses = await testDestination.testAction(
        'profile', {
          event,
          settings,
          mapping: {
            customer: { '@path': '$.userId' },
            account: { '@path': '$.traits.antavoAccount' },
            data: {
              first_name: { '@path': '$.traits.antavoFirstName' },
              last_name: { '@path': '$.traits.antavoLastName' },
              email: { '@path': '$.traits.antavoEmail' },
              birth_date: { '@path': '$.traits.antavoBirthDate' },
              gender: { '@path': '$.traits.antavoGender' },
              language: { '@path': '$.traits.antavoLanguage' },
              phone: { '@path': '$.traits.antavoPhone' },
              mobile_phone: { '@path': '$.traits.antavoMobilePhone' }
            }
          }
        })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(202)
      expect(responses[0].options.json).toMatchObject({
        customer: 'testUser',
        account: 'testAccount',
        data: {
          first_name: 'testFirstName',
          last_name: 'testLastName',
          email: 'test@test.com',
          birth_date: '1900-01-01',
          gender: 'testGender',
          language: 'testLanguage',
          phone: '123456',
          mobile_phone: '654321'
        },
        action: 'profile',
        api_key: 'testApiKey'
      })
    })
    it('Handle request without optional fields', async () => {
      nock(`https://api.${settings.stack}.antavo.com`)
        .post('/v1/webhook/segment')
        .reply(202, {})

      const event = createTestEvent({
        type: 'identify',
        userId: 'testUser',
        traits: {
          first_name: 'testFirstName',
          last_name: 'testLastName',
          email: 'test@test.com',
          birth_date: '1900-01-01',
          gender: 'testGender',
          language: 'testLanguage',
          phone: 123456,
          mobile_phone: 654321
        }
      })

      const responses = await testDestination.testAction(
        'profile', {
          event,
          settings,
          mapping: {
            customer: { '@path': '$.userId' },
            data: {
              first_name: { '@path': '$.traits.first_name' },
              last_name: { '@path': '$.traits.last_name' },
              email: { '@path': '$.traits.email' },
              birth_date: { '@path': '$.traits.birth_date' },
              gender: { '@path': '$.traits.gender' },
              language: { '@path': '$.traits.language' },
              phone: { '@path': '$.traits.phone' },
              mobile_phone: { '@path': '$.traits.mobile_phone' }
            }
          }
        })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(202)
      expect(responses[0].options.json).toMatchObject({
        customer: 'testUser',
        data: {
          first_name: 'testFirstName',
          last_name: 'testLastName',
          email: 'test@test.com',
          birth_date: '1900-01-01',
          gender: 'testGender',
          language: 'testLanguage',
          phone: '123456',
          mobile_phone: '654321'
        },
        action: 'profile',
        api_key: 'testApiKey'
      })
    })
    it('Throw error for missing required field: customer', async () => {
      nock(`https://api.${settings.stack}.antavo.com`)
        .post('/v1/webhook/segment')
        .reply(202, {})

      const event = createTestEvent({
        type: 'identify',
        userId: 'testUser',
        traits: {
          first_name: 'testFirstName',
          last_name: 'testLastName',
          email: 'test@test.com',
          telephone: 123456
        }
      })

      await expect(testDestination.testAction(
        'profile', {
          event,
          settings,
          mapping: {
            data: {
              first_name: { '@path': '$.traits.first_name' },
              last_name: { '@path': '$.traits.last_name' },
              email: { '@path': '$.traits.email' },
              mobile_phone: { '@path': '$.traits.telephone' }
            }
          }
        })
      ).rejects.toThrowError('The root value is missing the required field \'customer\'.')
    })
    it('Throw error for missing required field: data', async () => {
      nock(`https://api.${settings.stack}.antavo.com`)
        .post('/v1/webhook/segment')
        .reply(202, {})

      const event = createTestEvent({
        type: 'identify',
        userId: 'testUser',
        traits: {
          first_name: 'testFirstName',
          last_name: 'testLastName',
          email: 'test@test.com',
          telephone: 123456
        }
      })

      await expect(testDestination.testAction(
        'profile', {
          event,
          settings,
          mapping: {
            customer: { '@path': '$.userId' }
          }
        })
      ).rejects.toThrowError('The root value is missing the required field \'data\'.')
    })
  })
})
