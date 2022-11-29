import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import type { Settings } from '../generated-types'

const testDestination = createTestIntegration(Definition)

describe('Gainsight Px Cloud', () => {
  describe('testAuthentication', () => {
    it('should throw an error for incorrectly formatted api keys', async () => {
      const apiKey = "segtest";
      nock('https://segment-esp.aptrinsic.com/rte/segmentio')
        .post('/v1/push')
        .matchHeader('content-type', 'application/json')
        .reply(401, {
            message: `Unable to authenticate key '${apiKey}': not a valid API key structure`
          }
        );

      const authData: Settings = {
        apiKey,
        dataCenter: "north_america"
      }

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError('Invalid API key')
    })

    it('should throw an error for invalid api keys', async () => {
      const apiKey = "AP-segtest-2";
      nock('https://segment-esp.aptrinsic.com/rte/segmentio')
        .post('/v1/push')
        .matchHeader('content-type', 'application/json')
        .reply(401, {
          "message": `Unable to authenticate key '${apiKey}': Unknown subscription for ${apiKey}`
        });

      const authData: Settings = {
        apiKey,
        dataCenter: "north_america"
      }

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError('Invalid API key')
    })

    it('should NOT throw an error for valid api keys', async () => {
      const apiKey = "segtest";
      nock('https://segment-esp.aptrinsic.com/rte/segmentio')
        .post('/v1/push')
        .matchHeader('content-type', 'application/json')
        .reply(400, {} );

      const authData: Settings = {
        apiKey,
        dataCenter: "north_america"
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
