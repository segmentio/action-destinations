import { parseUserAgentProperties } from '../user-agent'

describe('amplitude - custom user agent parsing', () => {
  it('should parse custom user agent', () => {
    //This is borrowed from amplitude tests so we know its parsable:
    // https://github.com/amplitude/ua-parser-js/blob/master/test/device-test.json#L138
    const userAgent =
      '"Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/74.0.0.0 Safari/537.36"'

    const userAgentData = {
      architecture: 'arm',
      bitness: '64',
      brands: [
        {
          brand: 'Chromium',
          version: '116'
        },
        {
          brand: 'Not)A;Brand',
          version: '24'
        },
        {
          brand: 'Google Chrome',
          version: '116'
        }
      ],
      fullVersionList: [
        {
          brand: 'Chromium',
          version: '116.0.5845.110'
        },
        {
          brand: 'Not)A;Brand',
          version: '24.0.0.0'
        },
        {
          brand: 'Google Chrome',
          version: '116.0.5845.110'
        }
      ],
      mobile: false,
      model: 'TAB 2 A7',
      platform: 'macOS',
      platformVersion: '5.0.1',
      uaFullVersion: '116.0.5845.110',
      wow64: false
    }

    const result = parseUserAgentProperties(userAgent, userAgentData)

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
      os_version: '93'
    })
  })

  it('should return an empty object when there is no user agent', () => {
    const result = parseUserAgentProperties(undefined)
    expect(result).toEqual({})
  })

  it('should parse custom user agent and use userAgentData for os_version and device_model', () => {
    const userAgent =
      '"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36"'

    const userAgentData = {
      architecture: 'arm',
      bitness: '64',
      brands: [
        {
          brand: 'Chromium',
          version: '116'
        },
        {
          brand: 'Not)A;Brand',
          version: '24'
        },
        {
          brand: 'Google Chrome',
          version: '116'
        }
      ],
      fullVersionList: [
        {
          brand: 'Chromium',
          version: '116.0.5845.110'
        },
        {
          brand: 'Not)A;Brand',
          version: '24.0.0.0'
        },
        {
          brand: 'Google Chrome',
          version: '116.0.5845.110'
        }
      ],
      mobile: false,
      model: 'SM-J710FN',
      platform: 'macOS',
      platformVersion: '12.6.1',
      uaFullVersion: '116.0.5845.110',
      wow64: false
    }

    const result = parseUserAgentProperties(userAgent, userAgentData)

    expect(result).toEqual({
      device_model: 'SM-J710FN',
      device_type: undefined,
      os_name: 'Mac OS',
      os_version: '12.6.1'
    })
  })
})
