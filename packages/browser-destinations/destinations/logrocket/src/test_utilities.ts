import { Subscription } from '@segment/browser-destination-runtime/types'

class WorkerStub {
  url: string
  onmessage: (_arg: string) => void
  constructor(stringUrl: string) {
    this.url = stringUrl
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    this.onmessage = (_arg: string) => {}
  }

  postMessage(msg: string) {
    this.onmessage(msg)
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  addEventListener() {}
}

// logrocket >= 12 treats browsers without HTMLScriptElement.supports as unsupported and
// returns a no-op instance. The jsdom version used here doesn't implement it, so shim it.
// This runs on import, so test files must import this module before 'logrocket' or '../index'.
if (typeof HTMLScriptElement.supports !== 'function') {
  HTMLScriptElement.supports = () => true
}

export function mockWorkerAndXMLHttpRequest(): void {
  window.XMLHttpRequest = jest.fn() as any
  window.Worker = WorkerStub as any
}

export const trackSubscription: Subscription = {
  partnerAction: 'track',
  name: 'Track',
  enabled: true,
  subscribe: 'type = "track"',
  mapping: {
    name: {
      '@path': '$.name'
    },
    properties: {
      '@path': '$.properties'
    }
  }
}

export const identifySubscription: Subscription = {
  partnerAction: 'identify',
  name: 'Identify',
  enabled: true,
  subscribe: 'type = "identify"',
  mapping: {
    userId: {
      '@path': '$.userId'
    },
    traits: {
      '@path': '$.traits'
    }
  }
}

export const subscriptions = [trackSubscription, identifySubscription]
