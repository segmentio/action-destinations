import { Crypto } from '@peculiar/webcrypto'
import { TextEncoder, TextDecoder } from 'util'
import { setImmediate } from 'timers'

// fix: "ReferenceError: TextEncoder is not defined" after upgrading JSDOM
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
// fix: jsdom uses setImmediate under the hood for preflight XHR requests,
// and jest removed setImmediate, so we need to provide it to prevent console
// logging ReferenceErrors made by integration tests that call Amplitude.
global.setImmediate = setImmediate

beforeEach(() => {
  jest.restoreAllMocks()
  jest.resetAllMocks()

  // Reset the body and head between tests
  document.body.innerHTML = ''
  document.head.innerHTML = ''

  // Add a script tag to the document so `load-script` works (it expects existing scripts)
  const script = document.createElement('script')
  script.innerHTML = `// the emptiness`
  document.head.appendChild(script)

  jest.spyOn(window, 'window', 'get')
  jest.spyOn(global, 'document', 'get')
  jest.spyOn(console, 'error').mockImplementation(() => {})
  global.document.domain = 'segment.com'

  global.crypto = new Crypto()
})
