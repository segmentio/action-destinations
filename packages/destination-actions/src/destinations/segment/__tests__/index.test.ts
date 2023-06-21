import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { SEGMENT_ENDPOINTS, DEFAULT_SEGMENT_ENDPOINT } from '../properties'

const testDestination = createTestIntegration(Definition)
const segmentEndpoint = SEGMENT_ENDPOINTS[DEFAULT_SEGMENT_ENDPOINT].cdn
const authData = {
  source_write_key: 'test-source-write-key',
  endpoint: DEFAULT_SEGMENT_ENDPOINT
}

describe('Segment', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(segmentEndpoint).get(/.*/).reply(200, {})

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })

    it('should fail on authentication failure', async () => {
      nock(segmentEndpoint).get(/.*/).reply(401, {})

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError(
        new Error('Credentials are invalid: 401 Unauthorized')
      )
    })
  })
})
