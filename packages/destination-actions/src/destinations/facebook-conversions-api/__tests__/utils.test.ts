import { get_api_version } from '../utils'
import { API_VERSION, CANARY_API_VERSION } from '../constants'
import { StatsContext } from '@segment/actions-core/destination-kit'

describe('FacebookConversionsApi', () => {
  describe('get_api_version', () => {
    it('should return the canary API version', async () => {
      const features = {
        'facebook-capi-actions-canary-version': true
      }
      const version = get_api_version(features, {} as StatsContext)
      expect(version).toEqual(CANARY_API_VERSION)
    })

    it('should return the regular API version', async () => {
      const features = {}
      const version = get_api_version(features, {} as StatsContext)
      expect(version).toEqual(API_VERSION)
    })
  })
})
