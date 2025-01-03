import type { HeapMethods, UserConfig } from './types'

/**
 * Initialize the Heap script with the provided environment ID and configuration.
 */
export const initScript = (envId: string, config: UserConfig) => {
  // Ensure heapReadyCb exists on the window object
  window.heapReadyCb = window.heapReadyCb || []

  // Ensure heap exists on the window object
  window.heap = window.heap || ({} as any)

  window.heap.load = function (
    envId: string,
    clientConfig: UserConfig = { disableTextCapture: false, secureCookie: false }
  ): void {
    window.heap.envId = envId
    window.heap.clientConfig = clientConfig
    window.heap.clientConfig.shouldFetchServerConfig = false

    // Define all Heap API methods and add them to the heap object
    const methods: HeapMethods[] = [
      'init',
      'startTracking',
      'stopTracking',
      'track',
      'resetIdentity',
      'identify',
      'identifyHashed',
      'getSessionId',
      'getUserId',
      'getIdentity',
      'addUserProperties',
      'addEventProperties',
      'removeEventProperty',
      'clearEventProperties',
      'addAccountProperties',
      'addAdapter',
      'addTransformer',
      'addTransformerFn',
      'onReady',
      'addPageviewProperties',
      'removePageviewProperty',
      'clearPageviewProperties',
      'trackPageview'
    ]

    const createMethodProxy = (methodName: HeapMethods) => {
      return function (...args: any[]) {
        // Push method calls to heapReadyCb until the script is fully loaded
        window.heapReadyCb.push({
          name: methodName,
          fn: () => {
            if (window.heap[methodName]) {
              window.heap[methodName](...args)
            }
          }
        })
      }
    }

    // Proxy all methods to heap
    for (const method of methods) {
      window.heap[method] = createMethodProxy(method)
    }
  }

  window.heap.load(envId, config)
}
