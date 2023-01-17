import { parseUserAgentProperties } from '../user-agent'

describe('amplitude - custom user agent parsing', () => {
  it('should parse custom user agent', () => {
    //This is borrowed from amplitude tests so we know its parsable:
    // https://github.com/amplitude/ua-parser-js/blob/master/test/device-test.json#L138
    const userAgent =
      '"Mozilla/5.0 (Linux; Android 5.0.1; Lenovo TAB 2 A7-30HC Build/LRX21M; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/74.0.3729.157 Safari/537.36"'

    const result = parseUserAgentProperties(userAgent)

    expect(result).toEqual({
      os_name: 'Android',
      os_version: '5.0.1',
      device_model: 'TAB 2 A7',
      device_type: 'tablet'
    })
  })

  it('should parse custom user for desktop strings', () => {
    const userAgent =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36'
    const result = parseUserAgentProperties(userAgent)
    expect(result).toEqual({
      device_model: 'Mac OS',
      device_type: undefined,
      os_name: 'Mac OS',
      os_version: '10.15.7'
    })
  })

  it('should return an empty object when there is no user agent', () => {
    const result = parseUserAgentProperties(undefined)
    expect(result).toEqual({})
  })
})
