import type { AfterResponseHook } from '../../request-client'

const headersToObject = (headers: Headers) => {
  const obj: Record<string, string> = {}

  // @ts-ignore the types are wrong for Headers
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  for (const [key, value] of headers.entries()) {
    obj[key] = value
  }

  return obj
}

const prepareHeaders: AfterResponseHook = async (_request, _options, response) => {
  // Adds `toJSON()` support for headers to get a plain object
  Object.defineProperty(response.headers, 'toJSON', {
    enumerable: false,
    value: () => headersToObject(response.headers)
  })

  return response
}

export default prepareHeaders
