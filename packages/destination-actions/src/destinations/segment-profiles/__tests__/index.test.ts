import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { Settings } from '../generated-types'
import { SEGMENT_ENDPOINTS, DEFAULT_SEGMENT_ENDPOINT } from '../properties'

const testDestination = createTestIntegration(Definition)

describe('Segment Profiles', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      const segmentPAPIToken = 'segment-papi-token'

      nock(SEGMENT_ENDPOINTS[DEFAULT_SEGMENT_ENDPOINT].papi, {
        reqheaders: {
          // Check if the request has the correct authorization header
          authorization: (value) => value === `Bearer ${segmentPAPIToken}`
        }
      })
        .get(/.*/)
        .reply(200, {})

      // This should match your authentication.fields
      const authData: Settings = {
        segment_papi_token: segmentPAPIToken,
        endpoint: DEFAULT_SEGMENT_ENDPOINT
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
