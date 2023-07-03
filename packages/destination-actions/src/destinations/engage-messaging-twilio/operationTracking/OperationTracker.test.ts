/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { OperationTracker, TrackArgs, createTrackableDecoratorFactory } from './OperationTracker'

class TestTracker extends OperationTracker {
  logInfo = jest.fn()
  logError = jest.fn()
  stats = jest.fn()
}

const testTrackable = createTrackableDecoratorFactory<any>((t) => t.tracker)

function createTestClass(trackArgs: TrackArgs, testMethodImpl: (...args: any[]) => any) {
  class MyTestTarget {
    tracker: OperationTracker = new TestTracker()

    testMethodImpl = jest.fn(testMethodImpl)

    @testTrackable(trackArgs)
    testMethod(...args: any[]): any {
      return this.testMethodImpl(...args)
    }
  }

  return MyTestTarget
}

async function runTest<TParams extends any[]>(
  trackArgs: TrackArgs,
  testMethodImpl: (...args: TParams) => any,
  ...methodArgs: TParams
) {
  const MyTestClass = createTestClass(trackArgs, testMethodImpl)
  const classInstance = new MyTestClass()
  const testMethodMock = classInstance.testMethodImpl
  try {
    const testMethodResult = await classInstance.testMethod(...methodArgs)
    return { classInstance, testMethodResult, testMethodMock }
  } catch (e) {
    return { classInstance, testMethodError: e as any, testMethodMock }
  }
}

class MyCustomError extends Error {
  constructor(msg: string) {
    super(msg)
  }
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('operation tracker: log', () => {
  test('log sync method success', async () => {
    const testResult = await runTest({}, () => 'success')

    expect(testResult.testMethodResult).toBe('success')
    expect(testResult.classInstance.tracker.logInfo).toHaveBeenCalledTimes(2)
    expect(testResult.classInstance.tracker.logInfo).toHaveBeenCalledWith('testMethod Starting...')
    expect(testResult.classInstance.tracker.logInfo).toHaveBeenCalledWith(
      expect.stringContaining('testMethod succeeded after')
    )
    expect(testResult.classInstance.tracker.logError).toHaveBeenCalledTimes(0)
  })

  test('log sync method failed', async () => {
    const testResult = await runTest({}, () => {
      throw new MyCustomError('My custom error')
    })

    expect(testResult.testMethodError instanceof MyCustomError).toBe(true)
    expect(testResult.classInstance.tracker.logInfo).toHaveBeenCalledTimes(1)
    expect(testResult.classInstance.tracker.logInfo).toHaveBeenCalledWith('testMethod Starting...')
    expect(testResult.classInstance.tracker.logError).toHaveBeenCalledTimes(1)
    expect(testResult.classInstance.tracker.logError).toHaveBeenCalledWith(
      expectStringContainingAll('testMethod failed after', 'MyCustomError', testResult.testMethodError.message),
      testResult.testMethodError
    )
  })

  test('log async method success', async () => {
    const testResult = await runTest({}, () => new Promise((resolve) => setTimeout(() => resolve('success'), 100)))

    expect(testResult.testMethodResult).toBe('success')
    expect(testResult.classInstance.tracker.logInfo).toHaveBeenCalledTimes(2)
    expect(testResult.classInstance.tracker.logInfo).toHaveBeenCalledWith('testMethod Starting...')
    expect(testResult.classInstance.tracker.logInfo).toHaveBeenCalledWith(
      expect.stringContaining('testMethod succeeded after')
    )
    expect(testResult.classInstance.tracker.logError).toHaveBeenCalledTimes(0)
  })

  test('log async method failed', async () => {
    const testResult = await runTest(
      {},
      () => new Promise((_resolve, reject) => setTimeout(() => reject(new MyCustomError('My custom error')), 100))
    )

    expect(testResult.testMethodError instanceof MyCustomError).toBe(true)
    expect(testResult.classInstance.tracker.logInfo).toHaveBeenCalledTimes(1)
    expect(testResult.classInstance.tracker.logInfo).toHaveBeenCalledWith('testMethod Starting...')
    expect(testResult.classInstance.tracker.logError).toHaveBeenCalledTimes(1)
    expect(testResult.classInstance.tracker.logError).toHaveBeenCalledWith(
      expectStringContainingAll('testMethod failed after', 'MyCustomError', testResult.testMethodError.message),
      testResult.testMethodError
    )
  })

  test('log shouldLog false', async () => {
    const testResult = await runTest(
      { shouldLog: () => false },
      () => new Promise((resolve) => setTimeout(() => resolve('success'), 100))
    )

    expect(testResult.testMethodResult).toBe('success')
    expect(testResult.classInstance.tracker.logInfo).toHaveBeenCalledTimes(0)
  })

  test('log shouldLog finally only', async () => {
    const testResult = await runTest(
      { shouldLog: (t) => t.state == 'finally' },
      () => new Promise((resolve) => setTimeout(() => resolve('success'), 100))
    )

    expect(testResult.testMethodResult).toBe('success')
    expect(testResult.classInstance.tracker.logInfo).toHaveBeenCalledTimes(1)
    expect(testResult.classInstance.tracker.logInfo).toHaveBeenCalledWith(
      expect.stringContaining('testMethod succeeded after')
    )
  })
})

function expectStringContainingAll(...strings: string[]) {
  const wildcard = '(.*)'
  return expect.stringMatching(new RegExp(strings.join(wildcard) + wildcard))
}
