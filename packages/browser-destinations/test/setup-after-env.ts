beforeAll(() => {
  // Add a script tag to the document so `load-script` works (it expects existing scripts)
  const script = document.createElement('script')
  script.innerHTML = `// the emptyness`
  window.document.head.appendChild(script)
})

beforeEach(() => {
  jest.restoreAllMocks()
  jest.resetAllMocks()

  jest.spyOn(window, 'window', 'get')
  jest.spyOn(global, 'document', 'get')
  jest.spyOn(console, 'error').mockImplementation(() => {})
  global.document.domain = 'segment.com'
})
