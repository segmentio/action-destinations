import { resolveWhen } from '../resolve-when'

// jest.useFakeTimers was hard to use
const sleep = (time: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, time)
  })

describe(resolveWhen, () => {
  it('should resolve immediately', async () => {
    const resolveCb = jest.fn()
    const errorCb = jest.fn()

    await resolveWhen(() => true, 100)
      .then(resolveCb)
      .catch(errorCb)
    expect(errorCb).not.toHaveBeenCalled()
    expect(resolveCb).toHaveBeenCalled()
  })

  it('should reject after some time', async () => {
    const errorCb = jest.fn()
    await resolveWhen(() => false, 200, 300).catch(errorCb)
    expect(errorCb).toHaveBeenCalled()
  })

  it('should wait the correct amount of time before rejecting', async () => {
    const errorCb = jest.fn()
    void resolveWhen(() => false, 100, 500).catch(errorCb)
    await sleep(100)
    expect(errorCb).not.toHaveBeenCalled()
    await sleep(400)
    expect(errorCb).toHaveBeenCalled()
  })

  it('should still resolve if timeout is smaller than flush interval', async () => {
    const cb = jest.fn()
    await resolveWhen(() => true, 100, 50).then(cb)
    await sleep(100)
    expect(cb).toHaveBeenCalled()
  })
})
