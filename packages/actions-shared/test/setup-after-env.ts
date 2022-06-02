import nock from 'nock'

beforeEach(() => {
  // Removes mocks between unit tests so they run in isolation
  nock.cleanAll()
})

beforeAll(() => {
  // Disable external network requests
  nock.disableNetConnect()
  // But allow localhost connections so we can test local routes and mock servers.
  nock.enableNetConnect('127.0.0.1')

  if (!nock.isActive()) {
    nock.activate()
  }
})

afterAll(() => {
  // Avoids memory-leaks with the way nock monkey-patches http and Jest messes with modules
  nock.restore()
  // Re-enable external network requests
  nock.enableNetConnect()
  // Removes all remaining mocks
  nock.cleanAll()
})
