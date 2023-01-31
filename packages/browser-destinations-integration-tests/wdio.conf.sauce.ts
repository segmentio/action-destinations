import type { Options } from '@wdio/types'
import { config as base } from './wdio.conf.local'

export const config: Options.Testrunner = {
  ...base,
  user: process.env.SAUCE_USERNAME,
  key: process.env.SAUCE_ACCESS_KEY,
  region: 'us',
  capabilities: [
    // @ts-ignore - actually has an iterator
    ...base.capabilities,
    {
      browserName: 'firefox',
      browserVersion: 'latest',
      platformName: 'Windows 11',
      'sauce:options': {}
    },

    {
      browserName: 'safari',
      browserVersion: '16',
      platformName: 'macOS 12',
      'sauce:options': {}
    },
    {
      browserName: 'safari',
      platformName: 'ios',
      'appium:deviceName': 'iPhone Simulator',
      'appium:platformVersion': '13.4',
      'appium:automationName': 'XCUITest'
    }
  ],
  services: [
    [
      'sauce',
      {
        sauceConnect: true
      }
    ]
  ]
}
