import btoa from 'btoa-lite'
import type { BeforeRequestHook } from '../../request-client'

const addBasicAuthHeader: BeforeRequestHook = (options) => {
  if (options.username || options.password) {
    const username = options.username || ''
    const password = options.password || ''
    const encoded = btoa(`${username}:${password}`)
    const authorization = `Basic ${encoded}`

    return {
      headers: {
        Authorization: authorization
      }
    }
  }
}

export default addBasicAuthHeader
