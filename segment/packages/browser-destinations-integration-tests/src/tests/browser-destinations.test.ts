import page from '../pageobjects/page'
import { expect } from 'expect'
import { listDestinations } from '../server/utils'

// actions-plugins is just a shared chunk, we don't want to test it as a destination here
const allDestinations = listDestinations()
  .map((el) => el.dirPath)
  .filter((el) => el !== 'actions-plugin')

describe('Bundles are capable of being parsed and loaded without errors', () => {
  for (const destination of allDestinations) {
    it(destination, async () => {
      await page.loadDestination(destination)

      // written as a string so not transpiled -- using old JS to allow testing in old browsers.
      // the "return" is important for this to work on saucelabs.
      const code = `return (function() {
          for (var key in window) {
            if (key.indexOf('Destination') !== -1 && key.indexOf('webpack') === -1) {
              return typeof window[key]
            }
          }
        })()`
      const destinationGlobalType = await browser.execute(code)
      expect(destinationGlobalType).toBe('function')
    })
  }
})
