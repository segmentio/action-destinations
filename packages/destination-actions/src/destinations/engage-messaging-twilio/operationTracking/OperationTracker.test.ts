/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { OperationTracker, TrackArgs, createTrackableDecoratorFactory } from './OperationTracker'

class TestTracker extends OperationTracker {
  logInfo = jest.fn()
  logError = jest.fn()
  stats = jest.fn()
}

const testTrackable = createTrackableDecoratorFactory<any>((t) => t.tracker)

function createTestClass(trackArgs: TrackArgs | undefined, testMethodImpl: (...args: any[]) => any) {
  class MyTestTarget {
    tracker: OperationTracker = new TestTracker()

    testMethodImpl = jest.fn(testMethodImpl)

    @testTrackable(trackArgs)
    testMethod(...args: any[]): any {
      return this.testMethodImpl(...args)
    }

    @testTrackable(trackArgs)
    parentMethod(...args: any[]) {
      return {
        iAm: 'parent',
        child: this.childMethod(...args)
      }
    }

    @testTrackable(trackArgs)
    childMethod(...args: any[]) {
      return {
        iAm: 'child',
        testMethod: this.testMethod(...args)
      }
    }
  }

  return MyTestTarget
}

async function runTest<TParams extends any[]>(args: {
  trackArgs?: TrackArgs
  testMethodImpl: (...args: TParams) => any
  methodToRun?: 'testMethod' | 'parentMethod' | 'childMethod'
  methodArgs?: TParams
}) {
  const MyTestClass = createTestClass(args.trackArgs, args.testMethodImpl)
  const classInstance = new MyTestClass()
  const testMethodMock = classInstance.testMethodImpl
  try {
    const methodToRun = classInstance[args.methodToRun || 'testMethod'].bind(classInstance)
    const testMethodResult = await methodToRun(...(args.methodArgs || []))
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
    const testResult = await runTest({ testMethodImpl: () => 'success' })

    expect(testResult.testMethodResult).toBe('success')
    expectLogInfo(testResult.classInstance.tracker.logInfo, ['testMethod starting...'], ['testMethod succeeded after'])
    expect(testResult.classInstance.tracker.logError).toHaveBeenCalledTimes(0)
  })

  test('log sync method failed', async () => {
    const testResult = await runTest({
      testMethodImpl: () => {
        throw new MyCustomError('My custom error')
      }
    })

    expect(testResult.testMethodError instanceof MyCustomError).toBe(true)
    expectLogInfo(testResult.classInstance.tracker.logInfo, ['testMethod starting...'])
    expectLogError(testResult.classInstance.tracker.logError, [
      'testMethod failed after',
      'MyCustomError',
      testResult.testMethodError.message
    ])
  })

  test('log async method success', async () => {
    const testResult = await runTest({
      testMethodImpl: () => new Promise((resolve) => setTimeout(() => resolve('success'), 100))
    })

    expect(testResult.testMethodResult).toBe('success')
    expectLogInfo(testResult.classInstance.tracker.logInfo, ['testMethod starting...'], ['testMethod succeeded after'])
    expect(testResult.classInstance.tracker.logError).toHaveBeenCalledTimes(0)
  })

  test('log async method failed', async () => {
    const testResult = await runTest({
      testMethodImpl: () =>
        new Promise((_resolve, reject) => setTimeout(() => reject(new MyCustomError('My custom error')), 100))
    })

    expect(testResult.testMethodError instanceof MyCustomError).toBe(true)
    expectLogInfo(testResult.classInstance.tracker.logInfo, ['testMethod starting...'])
    expectLogError(testResult.classInstance.tracker.logError, [
      'testMethod failed after',
      'MyCustomError',
      testResult.testMethodError.message
    ])
  })

  test('log shouldLog false', async () => {
    const testResult = await runTest({
      trackArgs: { shouldLog: () => false },
      testMethodImpl: () => new Promise((resolve) => setTimeout(() => resolve('success'), 100))
    })

    expect(testResult.testMethodResult).toBe('success')
    expect(testResult.classInstance.tracker.logInfo).toHaveBeenCalledTimes(0)
    expect(testResult.classInstance.tracker.logError).toHaveBeenCalledTimes(0)
  })

  test('log shouldLog finally only', async () => {
    const testResult = await runTest({
      trackArgs: { shouldLog: (t) => t.state == 'finally' },
      testMethodImpl: () => new Promise((resolve) => setTimeout(() => resolve('success'), 100))
    })

    expect(testResult.testMethodResult).toBe('success')
    expectLogInfo(testResult.classInstance.tracker.logInfo, ['testMethod succeeded after'])
  })

  test('log onFinally hook', async () => {
    const myCustomError = new MyCustomError('My custom error')
    const someExtraErrorMessage = 'some extra info about error'
    function methodImpl(this: { tracker: OperationTracker }, throwError: boolean) {
      const instance = this.tracker
      return new Promise((resolve, reject) =>
        setTimeout(() => {
          instance.currentOperation?.onFinally.push((op) => {
            if (op.error) op.logs.push(someExtraErrorMessage)
          })
          if (throwError) reject(myCustomError)
          else resolve('success')
        }, 100)
      )
    }
    const testResultSuccess = await runTest({ testMethodImpl: methodImpl, methodArgs: [false] })
    expect(testResultSuccess.testMethodResult).toBe('success')
    expectLogInfo(
      testResultSuccess.classInstance.tracker.logInfo,
      ['testMethod starting...'],
      ['testMethod succeeded after']
    )

    const testResultFailure = await runTest({ testMethodImpl: methodImpl, methodArgs: [true] })
    expect(testResultFailure.testMethodError).toBe(myCustomError)
    expectLogInfo(testResultFailure.classInstance.tracker.logInfo, ['testMethod starting...'])
    expectLogError(testResultFailure.classInstance.tracker.logError, [
      'testMethod failed after',
      'MyCustomError',
      testResultFailure.testMethodError.message,
      someExtraErrorMessage
    ])
  })

  test('log error wrapping', async () => {
    const testResult = await runTest({
      trackArgs: { onError: () => ({ error: new MyCustomError('Wrapper error') }) },
      testMethodImpl: () => {
        throw new MyCustomError('Child error')
      }
    })
    expectLogError(testResult.classInstance.tracker.logError, ['Wrapper error', 'Child error'])
    expect(testResult.testMethodError!.message).toBe('Wrapper error')
    expect(testResult.testMethodError!.underlyingError.message).toBe('Child error')
  })

  test('log child operations success: parentMethod > childMethod > testMethod', async () => {
    const testRes = await runTest({
      testMethodImpl: () => {
        return 'test method'
      },
      methodToRun: 'parentMethod'
    })

    expect(testRes.testMethodResult).toMatchObject({
      iAm: 'parent',
      child: { iAm: 'child', testMethod: 'test method' }
    })
    const { logInfo } = testRes.classInstance.tracker
    expectLogInfo(
      logInfo,
      ['parentMethod starting'],
      ['parentMethod > childMethod starting'],
      ['parentMethod > childMethod > testMethod starting'],
      ['parentMethod > childMethod > testMethod succeeded'],
      ['parentMethod > childMethod succeeded'],
      ['parentMethod succeeded']
    )
  })

  test('log child operations failed: parentMethod > childMethod > testMethod', async () => {
    const myCustomError = new MyCustomError('My custom error')
    const testRes = await runTest({
      testMethodImpl: () => {
        throw myCustomError
      },
      methodToRun: 'parentMethod'
    })

    expect(testRes.testMethodError).toBe(myCustomError)

    expectLogInfo(
      testRes.classInstance.tracker.logInfo,
      ['parentMethod starting'],
      ['parentMethod > childMethod starting'],
      ['parentMethod > childMethod > testMethod starting']
    )
    expectLogError(
      testRes.classInstance.tracker.logError,
      ['parentMethod > childMethod > testMethod failed', myCustomError.message],
      ['parentMethod > childMethod failed'],
      ['parentMethod failed']
    )
  })
})

describe('operation tracker: stats', () => {})

function expectStringContainingAll(...strings: string[]) {
  const wildcard = '(.*)'
  return expect.stringMatching(new RegExp(strings.join(wildcard) + wildcard))
}

function expectLogInfo(logInfo: Function, ...messagesContains: string[][]) {
  expect(logInfo).toHaveBeenCalledTimes(messagesContains.length)
  for (const messageParts of messagesContains) {
    expect(logInfo).toHaveBeenCalledWith(expectStringContainingAll(...messageParts))
  }
}

function expectLogError(logError: Function, ...messagesContains: string[][]) {
  expect(logError).toHaveBeenCalledTimes(messagesContains.length)
  for (const messageParts of messagesContains) {
    expect(logError).toHaveBeenCalledWith(expectStringContainingAll(...messageParts), expect.anything())
  }
}
