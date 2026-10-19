import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { validateDatacenter } from '../utils'

const testDestination = createTestIntegration(Definition)

describe('validateDatacenter', () => {
  it.each([
    'iad2',
    'sjd1',
    'fra2',
    'syd2',
    'yul2',
    'pdx2',
    'g2-cmh',
    'ca2',
    'sin2',
    'co2',
    'lhr2',
    'hnd2',
    'UR_4tSrdGD2uXOeP5W'
  ])('accepts datacenter value %s', (datacenter) => {
    expect(() => validateDatacenter(datacenter)).not.toThrow()
  })

  it.each(['', 'a.b', 'a/b', 'a?b', 'a#b', 'a@b', 'a:b', 'a b', 'a\\b', 'a%2Fb', 'example.com/'])(
    'rejects datacenter value %j',
    (datacenter) => {
      expect(() => validateDatacenter(datacenter)).toThrow(/Invalid datacenter ID/)
    }
  )
})

describe('Qualtrics', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://testdc.qualtrics.com')
        .get('/API/v3/whoami')
        .matchHeader('x-api-token', 'VALID_API_TOKEN_VALUE')
        .reply(200, {
          result: {
            userName: 'abc'
          }
        })
      const authData = {
        apiToken: 'VALID_API_TOKEN_VALUE',
        datacenter: 'testdc'
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })

    // An existing customer configuration already has an underscore in its datacenter value.
    // Underscores can't alter the URL host, so allowing them is harmless, but delivery for that
    // configuration may already be failing and we have no way to verify it.
    it('should accept a datacenter containing an underscore', async () => {
      nock('https://UR_4tSrdGD2uXOeP5W.qualtrics.com')
        .get('/API/v3/whoami')
        .reply(200, { result: { userName: 'abc' } })
      const authData = {
        apiToken: 'VALID_API_TOKEN_VALUE',
        datacenter: 'UR_4tSrdGD2uXOeP5W'
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })

    it('throw error when no API Token', async () => {
      nock('https://testdc.qualtrics.com').get('/API/v3/whoami').matchHeader('x-api-token', '').reply(400, {})
      const authData = {
        apiToken: '',
        datacenter: 'testdc'
      }

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError(/400/)
    })

    it('throw error when API token invalid', async () => {
      nock('https://testdc.qualtrics.com').get('/API/v3/whoami').matchHeader('x-api-token', 'not-valid').reply(401, {})
      const authData = {
        apiToken: 'not-valid',
        datacenter: 'testdc'
      }

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError(/401/)
    })

    it('throw error when datacenter contains URL injection characters', async () => {
      const authData = {
        apiToken: 'VALID_API_TOKEN_VALUE',
        datacenter: 'attacker.com/path?x='
      }

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError(/Invalid datacenter ID/)
    })

    it('throw error when datacenter contains @ injection', async () => {
      const authData = {
        apiToken: 'VALID_API_TOKEN_VALUE',
        datacenter: 'attacker.com@legitimate'
      }

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError(/Invalid datacenter ID/)
    })
  })
})
