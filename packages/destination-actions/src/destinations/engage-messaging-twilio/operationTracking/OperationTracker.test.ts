/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { OperationLogger, OperationLoggerContext } from './OperationLogger'
import { OperationStats, OperationStatsContext } from './OperationStats'
import { OperationDecorator, ContextFromDecorator } from './OperationDecorator'
import { TryCatchFinallyHook } from './wrapTryCatchFinallyPromisable'
import { TrackedError } from './TrackedError'

class TestLogger extends OperationLogger {
  logInfo = jest.fn()
  logError = jest.fn()
  static getTryCatchFinallyHook(ctx: OperationLoggerContext): TryCatchFinallyHook<OperationLoggerContext> {
    return ctx.funcThis.logger
  }
}

class TestStats extends OperationStats {
  stats = jest.fn()
  static getTryCatchFinallyHook(ctx: OperationStatsContext): TryCatchFinallyHook<OperationStatsContext> {
    return ctx.funcThis.stats
  }
}

const testTrack = OperationDecorator.createDecoratorFactoryWithDefault(TestLogger, TestStats)
type TestOperationContext = ContextFromDecorator<typeof testTrack>

type TestDecoratorArgs = Parameters<typeof testTrack>[0]

function createTestClass(
  decoratorArgs: TestDecoratorArgs | undefined,
  testMethodImpl: (...args: any[]) => any,
  asyncMethods: boolean
) {
  class MyTestTargetBase {
    logger = new TestLogger()
    stats = new TestStats()

    testMethodImpl = jest.fn(testMethodImpl)

    @testTrack(decoratorArgs)
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
      @testTrack(decoratorArgs)
      async parentMethod(...args: any[]) {
        return {
          iAm: 'parent',
          child: await this.childMethod(...args)
        }
      }

      @testTrack(decoratorArgs)
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
      @testTrack(decoratorArgs)
      parentMethod(...args: any[]) {
        return {
          iAm: 'parent',
          child: this.childMethod(...args)
        }
      }

      @testTrack(decoratorArgs)
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
      test.each(<(TestDecoratorArgs | undefined)[]>[
        undefined,
        {},
        { operation: 'test_method' },
        {
          onError(_e) {}
        },
        {
          shouldLog: () => true,
          shouldStats: () => true
        },
        {
          shouldLog: () => false,
          shouldStats: () => false
        }
      ])(`${throwError ? 'error' : 'result'} passed through. decoratorArgs: %s`, async (decoratorArgs) => {
        const testMethod = function (this: any) {
          if (throwError) throw new MyCustomError('my custom error')
          expect(this).toEqual(instance)
          return {
            instance: this,
            result: 'success'
          }
        }
        const TestClass = createTestClass(decoratorArgs, testMethod, isAsync)
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
      decoratorArgs?: TestDecoratorArgs
      testMethodImpl: (...args: TParams) => any
      methodToRun?: 'testMethod' | 'parentMethod' | 'childMethod'
      methodArgs?: TParams
    }) {
      const MyTestClass = createTestClass(args.decoratorArgs, args.testMethodImpl, isAsync)
      const classInstance = new MyTestClass()
      const testMethodMock = classInstance.testMethodImpl
      try {
        const methodToRun = classInstance[args.methodToRun || 'testMethod'].bind(classInstance)
        const testMethodResult = await methodToRun(...(args.methodArgs || []))
        return { classInstance, testMethodResult, testMethodMock }
      } catch (e) {
        return { classInstance, testMethodError: e as Error, testMethodMock }
      }
    }

    test('when method succeeds', async () => {
      const testResult = await runTestMethod({ testMethodImpl: () => 'success' })

      expect(testResult.testMethodResult).toBe('success')
      expectLogInfo(testResult.classInstance.logger.logInfo, ['testMethod starting...'], ['testMethod succeeded after'])
      expect(testResult.classInstance.logger.logError).toHaveBeenCalledTimes(0)
    })

    test('on method failing', async () => {
      const testResult = await runTestMethod({
        testMethodImpl: () => {
          throw new MyCustomError('My custom error')
        }
      })

      expect(testResult.testMethodError instanceof MyCustomError).toBe(true)
      expectLogInfo(testResult.classInstance.logger.logInfo, ['testMethod starting...'])
      expectLogError(testResult.classInstance.logger.logError, [
        'testMethod failed after',
        'MyCustomError',
        testResult.testMethodError!.message
      ])
    })

    test('shouldLog false', async () => {
      const testResult = await runTestMethod({
        decoratorArgs: { shouldLog: () => false },
        testMethodImpl: () => 'success'
      })

      expect(testResult.testMethodResult).toBe('success')
      expect(testResult.classInstance.logger.logInfo).toHaveBeenCalledTimes(0)
      expect(testResult.classInstance.logger.logError).toHaveBeenCalledTimes(0)
    })

    test('shouldLog finally only', async () => {
      const testResult = await runTestMethod({
        decoratorArgs: { shouldLog: (t) => t.stage == 'finally' },
        testMethodImpl: () => 'success'
      })

      expect(testResult.testMethodResult).toBe('success')
      expectLogInfo(testResult.classInstance.logger.logInfo, ['testMethod succeeded after'])
    })

    test('onFinally hook to add extra data on error', async () => {
      const myCustomError = new MyCustomError('My custom error')
      const someExtraErrorMessage = 'some extra info about error'
      const methodImpl = function (this: any, throwError: boolean) {
        const op = testTrack.getCurrentOperation(this) as TestOperationContext
        op?.onFinally.push(() => {
          expect(!!op.error).toBe(throwError)
          op.logs.push(someExtraErrorMessage)
        })
        if (throwError) throw myCustomError
        else return 'success'
      }
      const testResultSuccess = await runTestMethod({ testMethodImpl: methodImpl, methodArgs: [false] })
      expect(testResultSuccess.testMethodResult).toBe('success')
      expectLogInfo(
        testResultSuccess.classInstance.logger.logInfo,
        ['testMethod starting...'],
        ['testMethod succeeded after', someExtraErrorMessage]
      )

      const testResultFailure = await runTestMethod({ testMethodImpl: methodImpl, methodArgs: [true] })
      expect(testResultFailure.testMethodError).toBe(myCustomError)
      expectLogInfo(testResultFailure.classInstance.logger.logInfo, ['testMethod starting...'])
      expectLogError(testResultFailure.classInstance.logger.logError, [
        'testMethod failed after',
        'MyCustomError',
        testResultFailure.testMethodError!.message,
        someExtraErrorMessage
      ])
    })

    test('onError for error wrapping', async () => {
      const testResult = await runTestMethod({
        decoratorArgs: {
          onError: (ctx) => {
            ctx.error = new MyCustomError('Wrapper error')
          }
        },
        testMethodImpl: () => {
          throw new MyCustomError('Child error')
        }
      })
      expectLogError(testResult.classInstance.logger.logError, ['Wrapper error', 'Child error'])
      expect(testResult.testMethodError!.message).toBe('Wrapper error')
      expect(((testResult.testMethodError as TrackedError).underlyingError as Error)?.message).toBe('Child error')
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
      const { logInfo } = testRes.classInstance.logger
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
        testRes.classInstance.logger.logInfo,
        ['parentMethod starting'],
        ['parentMethod > childMethod starting'],
        ['parentMethod > childMethod > testMethod starting']
      )
      expectLogError(
        testRes.classInstance.logger.logError,
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

      test('try and finally. decoratorArgs undefined', async () => {
        const TestClass = createTestClass(undefined, testMethod, isAsync)
        const testInstance = new TestClass()
        try {
          await testInstance.testMethod()
        } catch (e) {
          // eslint-disable-next-line no-empty
        }
        // by default we only produce stats on finally state, and two metrics - finally and
        expect(testInstance.stats.stats).toHaveBeenCalledTimes(2)
        const tags = [
          _throwError ? 'error:true' : 'error:false',
          ...(_throwError ? ['error_operation:testMethod', 'error_class:MyCustomError'] : [])
        ]
        expect(testInstance.stats.stats).toHaveBeenCalledWith({
          metric: 'testMethod',
          method: 'incr',
          value: 1,
          tags
        })
        expect(testInstance.stats.stats).toHaveBeenCalledWith({
          metric: 'testMethod.duration',
          method: 'histogram',
          value: expect.any(Number),
          tags
        })
      })

      test('try and finally. shouldStats:only on try', async () => {
        const TestClass = createTestClass({ shouldStats: (st) => st.event == 'try' }, testMethod, isAsync)
        const testInstance = new TestClass()
        try {
          await testInstance.testMethod()
        } catch (e) {
          // eslint-disable-next-line no-empty
        }
        expect(testInstance.stats.stats).toHaveBeenCalledTimes(1)
        expect(testInstance.stats.stats).toHaveBeenCalledWith({
          metric: 'testMethod.try',
          method: 'incr',
          value: 1,
          tags: []
        })
      })
    })
  })
})

function expectLogInfo(logInfo: Function, ...messagesContains: string[][]) {
  expect(logInfo).toHaveBeenCalledTimes(messagesContains.length)
  if (!jest.isMockFunction(logInfo)) fail('logInfo is not a mock function')
  else
    for (const messageParts of messagesContains) {
      const hasSomeMatches = logInfo.mock.calls.some((args: any[]) => {
        const [message, _meta] = args
        return messageParts.every((part) => message.includes(part))
      })
      if (!hasSomeMatches) {
        throw new Error(
          `expectLogInfo failed to match\nExpected: ${messageParts.join('*')}\nActual calls:\n${logInfo.mock.calls
            .map((args: any[]) => args.join(', '))
            .join('\n')}`
        )
      }
    }
}

function expectLogError(logError: Function, ...messagesContains: string[][]) {
  expect(logError).toHaveBeenCalledTimes(messagesContains.length)
  if (!jest.isMockFunction(logError)) fail('logInfo is not a mock function')
  else
    for (const messageParts of messagesContains) {
      const hasSomeMatches = logError.mock.calls.some((args: any[]) => {
        const [message, _meta] = args
        return messageParts.every((part) => message.includes(part))
      })
      if (!hasSomeMatches) {
        throw new Error(
          `expectLogError failed to match\nExpected: ${messageParts.join('*')}\nActual calls:\n${logError.mock.calls
            .map((args: any[]) => args.join(', '))
            .join('\n')}`
        )
      }
    }
}
