import { getBrowser, getBrowserVersion } from '../utils'

const userAgentToBrowserTestCase = [
  {
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
    browser: 'Chrome',
    version: '117.0.0.0'
  },
  {
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    browser: 'Safari',
    version: '17.0'
  },
  {
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    browser: 'Mobile Safari',
    version: '17.0'
  },
  {
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.2045.60',
    browser: 'Microsoft Edge',
    version: '117.0.2045.60'
  }
]

describe('Mixpanel Browser Utility Functions', () => {
  describe('getBrowser', () => {
    userAgentToBrowserTestCase.forEach((test) => {
      it(`should parse well-formed userAgent: ${test.browser}`, () => {
        expect(getBrowser(test.userAgent)).toEqual(test.browser)
      })
    })

    it(`return empty string for unknown browser`, () => {
      expect(getBrowser(`Non-existent userAgent`)).toEqual(``)
    })
  })

  describe('getVersion', () => {
    userAgentToBrowserTestCase.forEach((test) => {
      it(`should parse well-formed userAgent: ${test.browser}`, () => {
        expect(getBrowserVersion(test.userAgent)).toEqual(test.version)
      })
    })

    it(`return undefined for unknown browser`, () => {
      expect(getBrowserVersion(`unknown userAgent Version/118.0`)).toBeUndefined()
    })
  })
})
