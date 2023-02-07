import { Crypto } from '@peculiar/webcrypto'

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
