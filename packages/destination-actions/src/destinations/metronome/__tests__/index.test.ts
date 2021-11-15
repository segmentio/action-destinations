import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

import type { Settings } from '../generated-types'

const testDestination = createTestIntegration(Definition)

describe('Metronome', () => {
  describe('testAuthentication', () => {
    it('should validate valid auth tokens', async () => {
      nock('https://api.getmetronome.com').post('/v1/ingest').reply(400, {
        message: "[array is too short: must have at least 1 elements but instance has 0 elements]"
      });

      const authData: Settings = {
        apiToken: "mock-token"
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })

    it('should throw an error for invalid auth tokens', async () => {
      nock('https://api.getmetronome.com').post('/v1/ingest').reply(403, {
        "message": "Unauthorized"
      });

      const authData: Settings = {
        apiToken: "mock-token"
      }

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError()
    })
  })
})
