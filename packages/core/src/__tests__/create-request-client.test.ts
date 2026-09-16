import btoa from 'btoa-lite'
import createTestServer from 'create-test-server'
import createRequestClient from '../create-request-client'

describe('createRequestClient', () => {
  it('should create a request client instance that has Segment defaults', async () => {
    const log: Record<string, any> = {}

    const request = createRequestClient({
      afterResponse: [
        (request, options, response) => {
          log.request = request
          log.options = options
          log.response = response
        }
      ]
    })

    const server = await createTestServer()
    server.get('/', (_request, response) => {
      response.write('Hello world!')
      response.end()
    })

    await request(server.url)
    expect(log.request.headers.get('user-agent')).toBe('Segment (Actions)')
    expect(log.options.timeout).toBe(10000)
    await server.close()
  })

  it('should merge custom options when creating the request client instance', async () => {
    const log: Record<string, any> = {}

    const request = createRequestClient({
      headers: { Authorization: `Bearer supersekret` },
      afterResponse: [
        (request, options, response) => {
          log.request = request
          log.options = options
          log.response = response
        }
      ]
    })

    const server = await createTestServer()
    server.get('/', (_request, response) => {
      response.json({ greeting: 'Yo' })
    })

    const response = await request(server.url, { headers: { 'user-agent': 'foo' } })
    expect(await response.json()).toMatchObject({ greeting: 'Yo' })
    expect(response.url).toBe(`${server.url}/`)
    expect(log.request).toBeDefined()
    expect(log.request.url).toBe(`${server.url}/`)
    expect(log.request.headers.get('user-agent')).toBe('foo')
    expect(log.request.headers.get('authorization')).toBe('Bearer supersekret')
    await server.close()
  })

  it('should automatically base64 encode username:password', async () => {
    const log: Record<string, any> = {}

    const request = createRequestClient({
      afterResponse: [
        (request, options, response) => {
          log.request = request
          log.options = options
          log.response = response
        }
      ]
    })

    const server = await createTestServer()
    server.get('/', (_request, response) => {
      response.json({ greeting: 'Yo' })
    })

    await request(server.url, { username: 'foo', password: 'bar' })
    expect(log.request.headers.get('authorization')).toBe(`Basic ${btoa('foo:bar')}`)
    await server.close()
  })

  it('`response.data` should contain the json parsed body when content-type is application/json', async () => {
    const server = await createTestServer()
    server.post('/', (_request, response) => {
      response.json({ hello: 'world' })
    })

    const request = createRequestClient()

    await expect(request(server.url, { method: 'post', json: { foo: true } })).resolves.toMatchObject({
      data: expect.objectContaining({ hello: 'world' })
    })
    await server.close()
  })

  it('`response.data` should be null if parsing fails when content-type is application/json', async () => {
    const server = await createTestServer()
    server.post('/', (_request, response) => {
      response.set('Content-Type', 'application/json')
      // lies!
      response.write('')
      response.end()
    })

    const request = createRequestClient()

    await expect(request(server.url, { method: 'post', json: { foo: true } })).resolves.toMatchObject({
      data: undefined,
      content: ''
    })
    await server.close()
  })

  // STRATCONN-7032: prepareResponse now reads the body once (no clone) and re-exposes the body
  // accessors, so destinations that read the raw response keep working and large bodies never hang.
  it('re-exposes `.text()` and `.json()` after reading the body once', async () => {
    const server = await createTestServer()
    server.get('/', (_request, response) => {
      response.json({ hello: 'world' })
    })

    const request = createRequestClient()
    const response = await request(server.url)

    // Both raw accessors resolve (previously only possible because the original stream was cloned).
    expect(await response.text()).toBe(JSON.stringify({ hello: 'world' }))
    expect(await response.json()).toMatchObject({ hello: 'world' })
    // ...and they stay consistent with the parsed `.data`/`.content`.
    expect(response.data).toMatchObject({ hello: 'world' })
    await server.close()
  })

  it('re-exposes `.arrayBuffer()` with the exact bytes for a binary response', async () => {
    const bytes = Buffer.from([0x00, 0x01, 0x02, 0xff, 0xfe, 0x10])
    const server = await createTestServer()
    server.get('/', (_request, response) => {
      response.set('Content-Type', 'application/octet-stream')
      response.end(bytes)
    })

    const request = createRequestClient()
    const response = await request(server.url)

    expect(Buffer.from(await response.arrayBuffer()).equals(bytes)).toBe(true)
    await server.close()
  })

  it('resolves a large (>16KB) response without hanging on the clone deadlock', async () => {
    const large = 'a'.repeat(64 * 1024)
    const server = await createTestServer()
    server.get('/', (_request, response) => {
      response.end(large)
    })

    const request = createRequestClient()
    const response = await request(server.url)

    expect(response.content).toHaveLength(large.length)
    expect(await response.text()).toHaveLength(large.length)
    await server.close()
  })
})
