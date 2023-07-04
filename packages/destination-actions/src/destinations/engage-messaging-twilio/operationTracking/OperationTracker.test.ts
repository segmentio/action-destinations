/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { isAsyncFunction } from 'util/types'
import { OperationTracker, TrackArgs, createTrackableDecoratorFactory } from './OperationTracker'

class TestTracker extends OperationTracker {
  logInfo = jest.fn()
  logError = jest.fn()
  stats = jest.fn()
}

const testTrackable = createTrackableDecoratorFactory<any>((t) => t.tracker)

function createTestClass(trackArgs: TrackArgs | undefined, testMethodImpl: (...args: any[]) => any) {
  class MyTestTargetBase {
    tracker: OperationTracker = new TestTracker()

    testMethodImpl = jest.fn(testMethodImpl)

    @testTrackable(trackArgs)
    testMethod(...args: any[]): any {
      return this.testMethodImpl(...args)
    }
  }

  const isAsync = isAsyncFunction(testMethodImpl)
  if (isAsync) {
    class MyTestTargetAsync extends MyTestTargetBase {
      @testTrackable(trackArgs)
      async parentMethod(...args: any[]) {
        return {
          iAm: 'parent',
          child: await this.childMethod(...args)
        }
      }

      @testTrackable(trackArgs)
      async childMethod(...args: any[]) {
        return {
          iAm: 'child',
          testMethod: await this.testMethod(...args)
        }
      }
    }
    return MyTestTargetAsync
  } else {
    class MyTestTargetSync extends MyTestTargetBase {
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
    return MyTestTargetSync
  }
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('operation tracker: log', () => {
  describe.each([
    ['async target method', true],
    ['sync target method', false]
  ])('%s', (_name, isAsync) => {
    async function runTestMethod<TParams extends any[]>(args: {
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

    function asyncable<T extends (this: any, ...args: any[]) => any>(method: T) {
      return isAsync
        ? async function (this: any, ...args: any[]) {
            await new Promise((res) => setTimeout(res, 100))
            return method.apply(this, args)
          }
        : method
    }

    test('when method succeeds', async () => {
      const testResult = await runTestMethod({ testMethodImpl: asyncable(() => 'success') })

      expect(testResult.testMethodResult).toBe('success')
      expectLogInfo(
        testResult.classInstance.tracker.logInfo,
        ['testMethod starting...'],
        ['testMethod succeeded after']
      )
      expect(testResult.classInstance.tracker.logError).toHaveBeenCalledTimes(0)
    })

    test('on method failing', async () => {
      const testResult = await runTestMethod({
        testMethodImpl: asyncable(() => {
          throw new MyCustomError('My custom error')
        })
      })

      expect(testResult.testMethodError instanceof MyCustomError).toBe(true)
      expectLogInfo(testResult.classInstance.tracker.logInfo, ['testMethod starting...'])
      expectLogError(testResult.classInstance.tracker.logError, [
        'testMethod failed after',
        'MyCustomError',
        testResult.testMethodError.message
      ])
    })

    test('shouldLog false', async () => {
      const testResult = await runTestMethod({
        trackArgs: { shouldLog: () => false },
        testMethodImpl: asyncable(() => 'success')
      })

      expect(testResult.testMethodResult).toBe('success')
      expect(testResult.classInstance.tracker.logInfo).toHaveBeenCalledTimes(0)
      expect(testResult.classInstance.tracker.logError).toHaveBeenCalledTimes(0)
    })

    test('shouldLog finally only', async () => {
      const testResult = await runTestMethod({
        trackArgs: { shouldLog: (t) => t.state == 'finally' },
        testMethodImpl: asyncable(() => 'success')
      })

      expect(testResult.testMethodResult).toBe('success')
      expectLogInfo(testResult.classInstance.tracker.logInfo, ['testMethod succeeded after'])
    })

    test('onFinally hook to add extra data on error', async () => {
      const myCustomError = new MyCustomError('My custom error')
      const someExtraErrorMessage = 'some extra info about error'
      const methodImpl = asyncable(function (this: { tracker: OperationTracker }, throwError: boolean) {
        this.tracker.currentOperation?.onFinally.push((op) => {
          expect(!!op.error).toBe(throwError)
          op.logs.push(someExtraErrorMessage)
        })
        if (throwError) throw myCustomError
        else return 'success'
      })
      const testResultSuccess = await runTestMethod({ testMethodImpl: methodImpl, methodArgs: [false] })
      expect(testResultSuccess.testMethodResult).toBe('success')
      expectLogInfo(
        testResultSuccess.classInstance.tracker.logInfo,
        ['testMethod starting...'],
        ['testMethod succeeded after', someExtraErrorMessage]
      )

      const testResultFailure = await runTestMethod({ testMethodImpl: methodImpl, methodArgs: [true] })
      expect(testResultFailure.testMethodError).toBe(myCustomError)
      expectLogInfo(testResultFailure.classInstance.tracker.logInfo, ['testMethod starting...'])
      expectLogError(testResultFailure.classInstance.tracker.logError, [
        'testMethod failed after',
        'MyCustomError',
        testResultFailure.testMethodError.message,
        someExtraErrorMessage
      ])
    })

    test('onError for error wrapping', async () => {
      const testResult = await runTestMethod({
        trackArgs: { onError: () => ({ error: new MyCustomError('Wrapper error') }) },
        testMethodImpl: asyncable(() => {
          throw new MyCustomError('Child error')
        })
      })
      expectLogError(testResult.classInstance.tracker.logError, ['Wrapper error', 'Child error'])
      expect(testResult.testMethodError!.message).toBe('Wrapper error')
      expect(testResult.testMethodError!.underlyingError.message).toBe('Child error')
    })

    test('child operations success: parentMethod > childMethod > testMethod', async () => {
      const testRes = await runTestMethod({
        testMethodImpl: asyncable(() => 'test method'),
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

    test('child operations failed: parentMethod > childMethod > testMethod', async () => {
      const myCustomError = new MyCustomError('My custom error')
      const testRes = await runTestMethod({
        testMethodImpl: asyncable(() => {
          throw myCustomError
        }),
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
})

describe('operation tracker: stats', () => {
  describe.each([
    ['async target method', true],
    ['sync target method', false]
  ])('%s', (_testName, _isAsync) => {
    test.todo('success try and finally')
    test.todo('failed try and finally')
    test.todo('async success try and finally')
    test.todo('async failed try and finally')
    test.todo('success histogram')
    test.todo('failed histogram')
    test.todo('failed try and finally')
  })
})

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
