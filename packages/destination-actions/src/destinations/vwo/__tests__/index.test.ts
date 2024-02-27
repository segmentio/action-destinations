import { createTestIntegration } from '@segment/actions-core'
import Destination from '../index'
import type { Settings } from '../generated-types'
import { generateUUIDFor } from '../utility'

const testDestination = createTestIntegration(Destination)

describe('VWO AccountID Validation', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      const settings: Settings = {
        vwoAccountId: 654331
      }
      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })

    it('should throw error for invalid AccountId', async () => {
      const settings: Settings = {
        vwoAccountId: 65431231
      }
      await expect(testDestination.testAuthentication(settings)).rejects.toThrowError()
    })
  })
})

describe('UUID Generator', () => {
  describe('method: generateFor', () => {
    it('should return desired UUID for userId and accountId', () => {
      expect(generateUUIDFor('Varun', 12345)).toBe('C4D95C097902569F9A2D2E87CD3201C8')
      expect(generateUUIDFor('Alice', 12345)).toBe('E3B732864F315FB6974BC3EF4E2FD920')
      expect(generateUUIDFor('__123__', 12345)).toBe('50A5B167FB6356A796F91D8951E480EE')
      expect(generateUUIDFor('We@#dcs3232.f3', 12345)).toBe('AAB4580A6BB3525FAA31DC341752D501')
    })
  })
})
