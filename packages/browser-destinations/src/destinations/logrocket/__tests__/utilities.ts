class WorkerStub {
  url: string
  onmessage: (_arg: string) => void
  constructor(stringUrl: string) {
    this.url = stringUrl
    this.onmessage = (_arg: string) => {}
  }

  postMessage(msg: string) {
    this.onmessage(msg)
  }

  addEventListener() {}
}

export function mockWorkerAndXMLHttpRequest(): void {
  window.XMLHttpRequest = jest.fn()
  window.Worker = WorkerStub
}
