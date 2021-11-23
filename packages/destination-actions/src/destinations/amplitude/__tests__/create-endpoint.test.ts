import createEndpoint from '../create-endpoint'

describe('Amplitude - generate API endpoint', () => {
  it('should create a NA endpoint provided and path', () => {
    const path = 'identify'
    const result = createEndpoint(path)
    expect(result).toEqual('https://api.amplitude.com/identify')
  })

  it('should create a NA endpoint provided a region and path', () => {
    const region = 'northAmerica'
    const path = 'identify'
    const result = createEndpoint(path, region)
    expect(result).toEqual('https://api.amplitude.com/identify')
  })

  it('should create an EU endpoint provided an EU region and path', () => {
    const region = 'europe'
    const path = 'identify'
    const result = createEndpoint(path, region)
    expect(result).toEqual('https://api.eu.amplitude.com/identify')
  })

  it('should create an NA endpoint provided an invalid region but valid path', () => {
    const region = 'southAmerica'
    const path = 'identify'
    // @ts-ignore
    const result = createEndpoint(path, region)
    expect(result).toEqual('https://api.amplitude.com/identify')
  })

  it('should remove leading forward slashes from path', () => {
    const path = '//identify'
    const result = createEndpoint(path)
    expect(result).toEqual('https://api.amplitude.com/identify')
  })

  it('should allow path with multiple subdirectories', () => {
    const path = 'identify/test/1234'
    const result = createEndpoint(path)
    expect(result).toEqual('https://api.amplitude.com/identify/test/1234')
  })

  it('should allow for custom protocol', () => {
    const path = 'identify'
    const result = createEndpoint(path, undefined, { protocol: 'ws' })
    expect(result).toEqual('ws://api.amplitude.com/identify')
  })

  it('should remove :// from custom protocol', () => {
    const path = 'identify'
    const result = createEndpoint(path, undefined, { protocol: 'ws://' })
    expect(result).toEqual('ws://api.amplitude.com/identify')
  })

  it('should allow for custom endpoints', () => {
    const path = 'identify'
    const result1 = createEndpoint(path, 'europe', {
      protocol: 'https',
      subdomains: {
        europe: 'api.europe'
      }
    })
    expect(result1).toEqual('https://api.europe.amplitude.com/identify')

    const result2 = createEndpoint(path, undefined, {
      protocol: 'https',
      subdomains: {
        northAmerica: 'api.us'
      }
    })
    expect(result2).toEqual('https://api.us.amplitude.com/identify')

    const result3 = createEndpoint(path, 'europe', {
      protocol: 'https',
      subdomains: {
        northAmerica: 'api.us'
      }
    })
    expect(result3).toEqual('https://api.eu.amplitude.com/identify')

    const result4 = createEndpoint(path, 'europe', {
      protocol: 'https',
      subdomains: {
        northAmerica: 'api.us',
        europe: 'api.europe'
      }
    })
    expect(result4).toEqual('https://api.europe.amplitude.com/identify')
  })
})
