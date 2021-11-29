import { endpoints, getEndpointByRegion } from '../regional-endpoints'

describe('Amplitude - Regional endpoints', () => {
  it('should set region to north_america when no region is provided', () => {
    const result = getEndpointByRegion('httpapi')
    expect(result).toEqual(endpoints.httpapi.north_america)
  })
  it('should return the North American endpoint', () => {
    const result = getEndpointByRegion('httpapi', 'north_america')
    expect(result).toEqual(endpoints.httpapi.north_america)
  })
  it('should return the European endpoint', () => {
    const result = getEndpointByRegion('httpapi', 'europe')
    expect(result).toEqual(endpoints.httpapi.europe)
  })
  it('should return the North American endpoint when an invalid region is provided', () => {
    const result = getEndpointByRegion('httpapi', 'NONE')
    expect(result).toEqual(endpoints.httpapi.north_america)
  })
})
