import nock from 'nock'
import { Bucket } from 'src/types'

const bucketTestMock = `
(() => {
  const noop = () => {};

  const bucketTestInterface = {
    init: noop,
    user: noop,
    company: noop,
    track: noop,
    reset: noop
  };

  const callLog = [];

  window.bucket = new Proxy(bucketTestInterface, {
    get(bucket, property) {
      if (typeof bucket[property] === 'function') {
        return (...args) => {
          callLog.push({ method: property, args })
          return bucket[property](...args)
        }
      }

      if (property === 'callLog') {
        return callLog;
      }
    }
  });
})();
`

export function bucketTestHooks() {
  beforeAll(() => {
    nock.disableNetConnect()
  })

  beforeEach(() => {
    nock('https://cdn.jsdelivr.net')
      .get((uri) => uri.startsWith('/npm/@bucketco/tracking-sdk@'))
      .reply(200, bucketTestMock)
  })

  afterEach(function () {
    if (!nock.isDone()) {
      // @ts-expect-error no-unsafe-call
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      this.test.error(new Error('Not all nock interceptors were used!'))
    }

    nock.cleanAll()
  })

  afterAll(() => {
    nock.enableNetConnect()
  })
}

export function getBucketCallLog() {
  return (window.bucket as unknown as { callLog: Array<{ method: keyof Bucket; args: Array<unknown> }> }).callLog
}
