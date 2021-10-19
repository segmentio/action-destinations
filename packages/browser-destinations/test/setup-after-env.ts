import * as jsdom from 'jsdom'

let jsd: jsdom.JSDOM

const html = `
<!DOCTYPE html>
  <head>
    <script>'hi'</script>
  </head>
  <body>
  </body>
</html>
`.trim()

beforeEach(() => {
  jest.restoreAllMocks()
  jest.resetAllMocks()

  jsd = new jsdom.JSDOM(html, {
    runScripts: 'dangerously',
    resources: 'usable',
    url: 'https://segment.com'
  })

  jest.spyOn(window, 'window', 'get').mockImplementation(() => jsd.window as unknown as Window & typeof globalThis)
  jest.spyOn(global, 'document', 'get').mockImplementation(() => jsd.window.document as unknown as Document)
  jest.spyOn(console, 'error').mockImplementation(() => {})
  global.document.domain = 'segment.com'
})

afterEach(() => {
  if (jsd) jsd.window.close()
})
