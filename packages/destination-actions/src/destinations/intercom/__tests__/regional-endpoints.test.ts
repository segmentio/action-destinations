import { endpoints, getEndpointByRegion } from '../regional-endpoints'

describe('Intercom - Regional endpoints', () => {
  it('should set region to north_america when no region is provided', () => {
    const result = getEndpointByRegion()
    expect(result).toEqual(endpoints.north_america)
  })
  it('should return the North American endpoint', () => {
    const result = getEndpointByRegion('north_america')
    expect(result).toEqual(endpoints.north_america)
  })
  it('should return the European endpoint', () => {
    const result = getEndpointByRegion('europe')
    expect(result).toEqual(endpoints.europe)
  })
  it('should return the North American endpoint when an invalid region is provided', () => {
    const result = getEndpointByRegion('mistake')
    expect(result).toEqual(endpoints.north_america)
  })
  it('should return the correct endpoints', () => {
    expect(endpoints).toMatchInlineSnapshot(`
      Object {
        "australia": "https://api.au.intercom.io",
        "europe": "https://api.eu.intercom.io",
        "north_america": "https://api.intercom.io",
      }
    `)
  })
})
