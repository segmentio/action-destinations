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
    expect(log.request.headers.get('user-agent')).toBe('Segment')
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
})
