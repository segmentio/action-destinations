/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { OperationTracker, TrackArgs, createTrackDecoratorFactory } from './OperationTracker'

class TestTracker extends OperationTracker {
  logInfo = jest.fn()
  logError = jest.fn()
  stats = jest.fn()
}

const testTrack = createTrackDecoratorFactory<any>((t) => t.tracker)

function createTestClass(
  trackArgs: TrackArgs | undefined,
  testMethodImpl: (...args: any[]) => any,
  asyncMethods: boolean
) {
  class MyTestTargetBase {
    tracker: OperationTracker = new TestTracker()

    testMethodImpl = jest.fn(testMethodImpl)

    @testTrack(trackArgs)
    testMethod(...args: any[]): any {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const instance = this
      if (asyncMethods)
        return (async () => {
          await new Promise((res) => setTimeout(res, 100))
          return await testMethodImpl.apply(instance, args)
        })()
      return testMethodImpl.apply(instance, args)
    }
  }

  if (asyncMethods) {
    class MyTestTargetAsync extends MyTestTargetBase {
      @testTrack(trackArgs)
      async parentMethod(...args: any[]) {
        return {
          iAm: 'parent',
          child: await this.childMethod(...args)
        }
      }

      @testTrack(trackArgs)
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
      @testTrack(trackArgs)
      parentMethod(...args: any[]) {
        return {
          iAm: 'parent',
          child: this.childMethod(...args)
        }
      }

      @testTrack(trackArgs)
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

class MyCustomError extends Error {
  constructor(msg: string) {
    super(msg)
  }
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('pass through', () => {
  describe.each([
    ['async target method', true],
    ['sync target method', false]
  ])('%s', (_name, isAsync) => {
    describe.each([
      ['target method thows error', true],
      ['target completes successfully', false]
    ])('%s', (_name, throwError) => {
      test.each(<(TrackArgs | undefined)[]>[
        undefined,
        {},
        { operation: 'test_method' },
        {
          onError: (_e) => ({
            error: undefined,
            tags: undefined
          })
        },
        {
          shouldLog: () => true,
          shouldStats: () => true
        },
        {
          shouldLog: () => false,
          shouldStats: () => false
        }
      ])(`${throwError ? 'error' : 'result'} passed through. trackArgs: %s`, async (trackArgs) => {
        const testMethod = function (this: any) {
          if (throwError) throw new MyCustomError('my custom error')
          expect(this).toEqual(instance)
          return {
            instance: this,
            result: 'success'
          }
        }
        const TestClass = createTestClass(trackArgs, testMethod, isAsync)
        const instance = new TestClass()
        if (throwError) {
          await expect(async () => await instance.testMethod()).rejects.toThrow('my custom error')
          await expect(async () => await instance.parentMethod()).rejects.toThrow('my custom error')
        } else {
          const resTestMethod = await instance.testMethod()
          expect(resTestMethod.instance).toBe(instance)
          expect(resTestMethod.result).toBe('success')

          const resParentMethod = await instance.parentMethod()
          expect(resParentMethod).toMatchObject({
            iAm: 'parent',
            child: { iAm: 'child', testMethod: { instance, result: 'success' } }
          })
        }
      })
    })
  })
})

describe('log', () => {
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
      const MyTestClass = createTestClass(args.trackArgs, args.testMethodImpl, isAsync)
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

    test('when method succeeds', async () => {
      const testResult = await runTestMethod({ testMethodImpl: () => 'success' })

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

    test('shouldLog false', async () => {
      const testResult = await runTestMethod({
        trackArgs: { shouldLog: () => false },
        testMethodImpl: () => 'success'
      })

      expect(testResult.testMethodResult).toBe('success')
      expect(testResult.classInstance.tracker.logInfo).toHaveBeenCalledTimes(0)
      expect(testResult.classInstance.tracker.logError).toHaveBeenCalledTimes(0)
    })

    test('shouldLog finally only', async () => {
      const testResult = await runTestMethod({
        trackArgs: { shouldLog: (t) => t.state == 'finally' },
        testMethodImpl: () => 'success'
      })

      expect(testResult.testMethodResult).toBe('success')
      expectLogInfo(testResult.classInstance.tracker.logInfo, ['testMethod succeeded after'])
    })

    test('onFinally hook to add extra data on error', async () => {
      const myCustomError = new MyCustomError('My custom error')
      const someExtraErrorMessage = 'some extra info about error'
      const methodImpl = function (this: { tracker: OperationTracker }, throwError: boolean) {
        this.tracker.currentOperation?.onFinally.push((op) => {
          expect(!!op.error).toBe(throwError)
          op.logs.push(someExtraErrorMessage)
        })
        if (throwError) throw myCustomError
        else return 'success'
      }
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
        testMethodImpl: () => {
          throw new MyCustomError('Child error')
        }
      })
      expectLogError(testResult.classInstance.tracker.logError, ['Wrapper error', 'Child error'])
      expect(testResult.testMethodError!.message).toBe('Wrapper error')
      expect(testResult.testMethodError!.underlyingError.message).toBe('Child error')
    })

    test('child operations success: parentMethod > childMethod > testMethod', async () => {
      const testRes = await runTestMethod({
        testMethodImpl: () => 'test method',
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
})

describe('stats', () => {
  describe.each([
    ['async target method', true],
    ['sync target method', false]
  ])('%s', (_testName, isAsync) => {
    describe.each([
      ['target method thows error', true],
      ['target completes successfully', false]
    ])('%s', (_testName, _throwError) => {
      const testMethod = jest.fn(function () {
        if (_throwError) throw new MyCustomError('My custom error')
        return 'success'
      })

      test('try and finally. trackargs undefined', async () => {
        const TestClass = createTestClass(undefined, testMethod, isAsync)
        const testInstance = new TestClass()
        try {
          await testInstance.testMethod()
        } catch (e) {
          // eslint-disable-next-line no-empty
        }
        // by default we only produce stats on finally state, and two metrics - finally and
        expect(testInstance.tracker.stats).toHaveBeenCalledTimes(2)
        const extraTags = [
          _throwError ? 'error:true' : 'error:false',
          ...(_throwError ? ['error_operation:testMethod', 'error_class:MyCustomError'] : [])
        ]
        expect(testInstance.tracker.stats).toHaveBeenCalledWith({
          metric: 'testMethod.finally',
          method: 'incr',
          value: 1,
          extraTags
        })
        expect(testInstance.tracker.stats).toHaveBeenCalledWith({
          metric: 'testMethod.duration',
          method: 'histogram',
          value: expect.any(Number),
          extraTags
        })
      })

      test('try and finally. shouldStats:only on try', async () => {
        const TestClass = createTestClass({ shouldStats: (op) => op.state == 'try' }, testMethod, isAsync)
        const testInstance = new TestClass()
        try {
          await testInstance.testMethod()
        } catch (e) {
          // eslint-disable-next-line no-empty
        }
        expect(testInstance.tracker.stats).toHaveBeenCalledTimes(1)
        expect(testInstance.tracker.stats).toHaveBeenCalledWith({ metric: 'testMethod.try', method: 'incr', value: 1 })
      })
    })
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
