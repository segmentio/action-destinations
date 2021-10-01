/* eslint-disable @typescript-eslint/no-empty-function */
import AbortController from 'abort-controller'
import createTestServer from 'create-test-server'
import { URLSearchParams } from 'url'
import createInstance from '../request-client'
import { Response } from '../fetch'

describe('createInstance', () => {
  it('should create a new request client instance', async () => {
    const server = await createTestServer()
    server.get('/', (_request, response) => {
      response.end()
    })

    const request = createInstance()
    expect((await request(server.url)).ok).toBe(true)
    await server.close()
  })

  it('should merge options with instance defaults', async () => {
    const server = await createTestServer()
    server.post('/', (_request, response) => {
      response.end()
    })

    let finalOptions: any
    const request = createInstance({
      method: 'get',
      afterResponse: [
        (_request, options) => {
          finalOptions = options
        }
      ]
    })

    expect((await request(server.url, { method: 'post' })).ok).toBe(true)
    expect(finalOptions.method).toBe('POST')
    await server.close()
  })

  it('should dedupe headers when merging options', async () => {
    const server = await createTestServer()
    server.get('/', (_request, response) => {
      response.end()
    })

    let finalOptions: any
    const request = createInstance({
      method: 'get',
      headers: {
        'content-type': 'application/json'
      },
      afterResponse: [
        (_request, options) => {
          finalOptions = options
        }
      ]
    })

    expect((await request(server.url, { headers: { 'Content-Type': 'text/plain' } })).ok).toBe(true)
    expect(finalOptions.headers.get('content-type')).toBe('text/plain')
    await server.close()
  })
})

describe('request.extend()', () => {
  it('should allow extending an existing instance with new defaults', async () => {
    const server = await createTestServer()
    server.get('/', (_request, response) => {
      response.end()
    })

    let opts: any

    const request = createInstance({
      timeout: 5000
    }).extend({
      timeout: 8000,
      afterResponse: [
        (_request, options) => {
          opts = options
        }
      ]
    })

    expect((await request(server.url)).ok).toBe(true)
    expect(opts.timeout).toBe(8000)
    await server.close()
  })

  it('should concatenate arrays when merging options', async () => {
    const server = await createTestServer()
    server.get('/', (_request, response) => {
      response.end()
    })

    let calledFirst = false
    let calledSecond = false

    const request = createInstance({
      beforeRequest: [
        () => {
          calledFirst = true
        }
      ]
    }).extend({
      beforeRequest: [
        () => {
          calledSecond = true
        }
      ]
    })

    expect((await request(server.url)).ok).toBe(true)
    expect(calledFirst).toBe(true)
    expect(calledSecond).toBe(true)
    await server.close()
  })
})

describe('request()', () => {
  it('should perform GET requests', async () => {
    const server = await createTestServer()
    server.get('/', (_request, response) => {
      response.end()
    })

    const request = createInstance()
    expect((await request(server.url, { method: 'get' })).ok).toBe(true)
    await server.close()
  })

  it('should perform POST requests', async () => {
    const server = await createTestServer()
    server.post('/', (_request, response) => {
      response.end()
    })

    const request = createInstance()
    expect((await request(server.url, { method: 'post' })).ok).toBe(true)
    await server.close()
  })

  it('should perform PUT requests', async () => {
    const server = await createTestServer()
    server.put('/', (_request, response) => {
      response.end()
    })

    const request = createInstance()
    expect((await request(server.url, { method: 'put' })).ok).toBe(true)
    await server.close()
  })

  it('should perform DELETE requests', async () => {
    const server = await createTestServer()
    server.delete('/', (_request, response) => {
      response.end()
    })

    const request = createInstance()
    expect((await request(server.url, { method: 'delete' })).ok).toBe(true)
    await server.close()
  })

  it('should perform HEAD requests', async () => {
    const server = await createTestServer()
    server.head('/', (_request, response) => {
      response.end()
    })

    const request = createInstance()
    expect((await request(server.url, { method: 'head' })).ok).toBe(true)
    await server.close()
  })

  it('`method` should automatically get upcased for consistency', async () => {
    const server = await createTestServer()
    server.post('/', (_request, response) => {
      response.end()
    })

    let options: any
    const request = createInstance({
      beforeRequest: [
        (requestOptions) => {
          options = requestOptions
        }
      ]
    })

    expect((await request(server.url, { method: 'post' })).ok).toBe(true)
    expect(options.method).toBe('POST')
    await server.close()
  })

  it('`timeout` should abort requests when a timeout occurs', async () => {
    const server = await createTestServer()
    server.get('/', (_request, response) => {
      setTimeout(() => {
        response.end()
      }, 1000)
    })

    let called = false
    const request = createInstance({
      afterResponse: [
        () => {
          called = true
        }
      ]
    })

    await expect(request(server.url, { timeout: 500 })).rejects.toThrowError('Request timed out')
    expect(called).toBe(false)
    await server.close()
  })

  it('`timeout` should throw when a timeout occurs before a response is received', async () => {
    const server = await createTestServer()
    server.get('/', (_request, response) => {
      setTimeout(() => {
        response.end()
      }, 1000)
    })

    const request = createInstance()

    await expect(request(server.url, { timeout: 500 })).rejects.toThrowError('Request timed out')
    await server.close()
  })

  it('`timeout` should abort the request when the provided `signal` is aborted', async () => {
    const controller = new AbortController()
    const server = await createTestServer()
    server.get('/', (_request, response) => {
      setTimeout(() => {
        response.end()
      }, 10000)
    })

    const request = createInstance()

    // input signal gets aborted before request
    setTimeout(() => {
      controller.abort()
    }, 500)

    await expect(request(server.url, { signal: controller.signal })).rejects.toThrowError('The user aborted a request.')
    await server.close()
  })

  it('`timeout` should be cleared if the response succeeds before the timeout', async () => {
    const server = await createTestServer()
    server.get('/', (_request, response) => {
      response.end()
    })

    const request = createInstance()

    await expect(request(server.url, { timeout: 1000 })).resolves.toMatchObject({ ok: true })
    await server.close()
  })

  it('`throwHttpErrors` should not throw for non-2xx status codes when `false`', async () => {
    const server = await createTestServer()
    server.get('/', (_request, response) => {
      response.status(404)
      response.end()
    })

    const request = createInstance()
    const response = await request(server.url, { throwHttpErrors: false })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(404)
    expect(response.statusText).toBe('Not Found')
    await server.close()
  })

  it('`throwHttpErrors` should throw for non-2xx status codes by default', async () => {
    const server = await createTestServer()
    server.get('/', (_request, response) => {
      response.status(404)
      response.end()
    })

    const request = createInstance()

    await expect(request(server.url)).rejects.toThrowError('Not Found')
    await server.close()
  })

  it("`json` should automatically get stringify'd and include proper request headers", async () => {
    const server = await createTestServer()
    server.post('/', (_request, response) => {
      response.end()
    })

    let instance: any
    const request = createInstance({
      afterResponse: [
        (request, options, response) => {
          instance = { request, options, response }
        }
      ]
    })

    await expect(request(server.url, { method: 'post', json: { foo: true } })).resolves.toMatchObject({ ok: true })
    expect(instance.options.body).toBe(JSON.stringify({ foo: true }))
    expect(instance.request.headers.get('content-type')).toBe('application/json')
    await server.close()
  })

  it('`searchParams` should support URLSearchParams to produce the request url', async () => {
    const server = await createTestServer()
    server.get('/', (_request, response) => {
      response.end()
    })

    let instance: any
    const request = createInstance({
      afterResponse: [
        (request, options, response) => {
          instance = { request, options, response }
        }
      ]
    })

    const response = await request(server.url, { searchParams: new URLSearchParams({ foo: '1', bar: 'true' }) })

    expect(response.ok).toBe(true)
    expect(instance.request.url).toBe(`${server.url}/?foo=1&bar=true`)
    await server.close()
  })

  it('`searchParams` should support a plain object', async () => {
    const server = await createTestServer()
    server.get('/', (_request, response) => {
      response.end()
    })

    let instance: any
    const request = createInstance({
      afterResponse: [
        (request, options, response) => {
          instance = { request, options, response }
        }
      ]
    })

    const response = await request(server.url, { searchParams: { foo: 1, bar: true } })

    expect(response.ok).toBe(true)
    expect(instance.request.url).toBe(`${server.url}/?foo=1&bar=true`)
    await server.close()
  })

  it('`beforeRequest` hooks should run before a request is made', async () => {
    const server = await createTestServer()
    let requestReceived = false
    server.get('/', (_request, response) => {
      requestReceived = true
      response.end()
    })

    const request = createInstance({
      beforeRequest: [
        () => {
          expect(requestReceived).toBe(false)
        }
      ]
    })

    const response = await request(server.url)
    expect(response.ok).toBe(true)
    expect(requestReceived).toBe(true)
    await server.close()
  })

  it('`beforeRequest` hooks should be able to modify the request options', async () => {
    const server = await createTestServer()
    server.get('/', (_request, response) => {
      response.end()
    })

    let instance: any
    const request = createInstance({
      beforeRequest: [
        () => {
          return {
            headers: {
              'x-test': 'test'
            }
          }
        }
      ],
      afterResponse: [
        (request) => {
          instance = { request }
        }
      ]
    })

    const response = await request(server.url)
    expect(response.ok).toBe(true)
    expect(instance.request.headers.get('x-test')).toBe('test')
    await server.close()
  })

  it('`afterResponse` hooks should run after a response is received', async () => {
    const server = await createTestServer()
    let called = false
    server.get('/', (_request, response) => {
      called = true
      response.end()
    })

    const request = createInstance({
      afterResponse: [
        (_request, _options, response) => {
          expect(called).toBe(true)
          expect(response).toBeDefined()
        }
      ]
    })

    const response = await request(server.url)
    expect(response.ok).toBe(true)
    await server.close()
  })

  it('`afterResponse` hooks should be able to modify the response object', async () => {
    const server = await createTestServer()
    server.get('/', (_request, response) => {
      response.end()
    })

    const request = createInstance({
      afterResponse: [
        () => {
          return new Response(new URLSearchParams({ hello: 'world' }), { status: 201 })
        }
      ]
    })

    const response = await request(server.url)
    expect(response.ok).toBe(true)
    expect(response.status).toBe(201)
    expect(await response.text()).toBe('hello=world')
    await server.close()
  })
})
