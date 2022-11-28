import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import { getEndpointByRegion } from '../regional-endpoints'
import Definition from '../index'

const api_id = 'APP_ID'
const api_key = 'APP_KEY'
const region = 'SOME_REGION'

const endpoint = getEndpointByRegion()

const testDestination = createTestIntegration(Definition)

describe('Moengage', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(`${endpoint}`).get('/v1/integrations/segment/auth?appId=SOME_APP_ID').reply(200, {})

      const settings = {
        api_id: api_id,
        api_key: api_key,
        region: region
      }

      await expect(testDestination.testAuthentication(settings)).rejects.toThrow(
        `Endpoint Region must be one of: "DC_01", "DC_02", "DC_03", or "DC_04".`
      )
    })

    it('should validate', async () => {
      const settings = {
        api_id: api_id,
        api_key: api_key,
        region: 'DC_01'
      }

      nock(`${endpoint}`).get(`/v1/integrations/segment/auth?appId=${settings.api_id}`).reply(200, {})
      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })
  })
})
