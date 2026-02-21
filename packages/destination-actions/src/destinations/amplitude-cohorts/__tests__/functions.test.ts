import { getEndpointByRegion } from '../functions'

describe('Amplitude Cohorts functions', () => {
  describe('getEndpointByRegion', () => {
    it('should return north america endpoint by default', () => {
      const result = getEndpointByRegion('cohorts_upload')
      expect(result).toBe('https://amplitude.com/api/3/cohorts/upload')
    })

    it('should return europe endpoint when specified', () => {
      const result = getEndpointByRegion('cohorts_membership', 'europe')
      expect(result).toBe('https://analytics.eu.amplitude.com/api/3/cohorts/membership')
    })
  })
})
