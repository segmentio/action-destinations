import { createTestEvent } from '@segment/actions-core'
import { parseUserAgent } from '../user-agent'
describe('amplitude - custom user agent parsing', () => {
  it('should parse custom user agent', () => {
    const event = createTestEvent({
      context: {
        //This is borrowed from amplitude tests so we know its parsable:
        // https://github.com/amplitude/ua-parser-js/blob/master/test/device-test.json#L138
        userAgent:
          '"Mozilla/5.0 (Linux; Android 5.0.1; Lenovo TAB 2 A7-30HC Build/LRX21M; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/74.0.3729.157 Safari/537.36"'
      }
    })
    const result = parseUserAgent(event)
    expect(result).toEqual({
      os_name: 'Android',
      device_manufacturer: 'Lenovo',
      device_model: 'TAB 2 A7'
    })
  })
})
