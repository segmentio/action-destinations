/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ExecuteInput, IntegrationError } from '@segment/actions-core/src'
import { MessagePayloadBase, MessageSendPerformer, MessageSettingsBase } from '../MessageSendPerformer'
import { EngageDestinationCache } from '@segment/actions-core/destination-kit'
import { isRetryableError } from '../isRetryableError'

type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}

type TestExecuteInput = Mutable<ExecuteInput<MessageSettingsBase, MessagePayloadBase>> & { rawData: any }

class TestMessageSendPerformer extends MessageSendPerformer<MessageSettingsBase, MessagePayloadBase> {
  isSupportedExternalId(_externalId: any): boolean {
    return true
  }

  executeInput: TestExecuteInput

  sendToRecepient: (_recepient: any) => Promise<any> = jest.fn(async (_recepient) => {
    return this.sendToRecepientImpl?.(_recepient)
  })

  getIntegrationStatsName(): string {
    return 'test-integration'
  }

  getChannelType(): string {
    return 'test-channel'
  }

  constructor(
    public sendToRecepientImpl: typeof TestMessageSendPerformer.prototype.sendToRecepient | undefined = undefined,
    public mockRequestClient: jest.Mock = jest.fn()
  ) {
    super(mockRequestClient, <TestExecuteInput>{
      settings: {
        profileApiEnvironment: 'test-profile-api-environment',
        profileApiAccessToken: 'test-profile-api-access-token'
      },
      payload: {
        externalIds: [
          { channelType: 'test-channel', id: 'test-external-id', subscriptionStatus: 'subscribed', type: 'test-type' }
        ],
        send: true
      },
      rawData: {
        messageId: 'test-message-id'
      },
      statsContext: {
        statsClient: {
          incr: jest.fn(),
          histogram: jest.fn(),
          set: jest.fn(),
          _tags: jest.fn(),
          observe: jest.fn(),
          _name: jest.fn()
        },
        tags: []
      },
      features: {
        'engage-cache-send-message': true,
        'engage-cache-email-template': true
      }
    })
  }
}

class TestCache implements EngageDestinationCache {
  cache: Map<string, { val: any; exp: Date }> = new Map()

  async getByKeyImpl(key: string): Promise<string | null> {
    const c = this.cache.get(key)
    if (!c) return null
    if (c.exp < new Date()) {
      await this.delByKeyImpl(key)
      return null
    }
    return c.val
  }

  getByKey: (key: string) => Promise<string | null> = jest.fn(this.getByKeyImpl.bind(this))

  async setByKeyNXImpl(key: string, value: string, expiryInSeconds?: number): Promise<boolean> {
    if (this.cache.has(key)) return false

    //await this.setByKeyImpl(key, value, expiryInSeconds)
    this.cache.set(key, { val: value, exp: new Date(Date.now() + (expiryInSeconds ?? this.maxExpirySeconds) * 1000) })
    return true
  }
  setByKeyNX: (key: string, value: string, expiryInSeconds?: number) => Promise<boolean> = jest.fn(
    this.setByKeyNXImpl.bind(this)
  )

  async setByKeyImpl(key: string, value: string, expiryInSeconds?: number): Promise<boolean> {
    this.cache.set(key, { val: value, exp: new Date(Date.now() + (expiryInSeconds ?? this.maxExpirySeconds) * 1000) })
    return true
  }

  setByKey: (key: string, value: string, expiryInSeconds?: number) => Promise<boolean> = jest.fn(
    this.setByKeyImpl.bind(this)
  )

  delByKeyImpl: (key: string) => Promise<number> = async (key: string) => {
    return this.cache.delete(key) ? 1 : 0
  }
  delByKey: (key: string) => Promise<number> = jest.fn(this.delByKeyImpl.bind(this))

  maxExpirySeconds = 60 * 60 * 4
  maxValueSizeBytes = 6_000_000
}

describe('Message send performer', () => {
  describe('cache', () => {
    const cache = new TestCache()
    function createPerformer(
      sendToRecepient: typeof TestMessageSendPerformer.prototype.sendToRecepient | undefined = undefined
    ) {
      const performer = new TestMessageSendPerformer(sendToRecepient) as Mutable<TestMessageSendPerformer>
      performer.executeInput.engageDestinationCache = cache
      performer.engageDestinationCache = performer.executeInput.engageDestinationCache
      return performer
    }

    beforeEach(() => {
      cache.cache.clear()
      jest.clearAllMocks()
    })

    async function runManyPerformers(args: {
      amount?: number
      sequentially?: boolean
      sendToRecepient?: (this: TestMessageSendPerformer) => any | Promise<any>
      performerInit?: (performer: Mutable<TestMessageSendPerformer>, index: number) => void
      randomStartDelay?: number
      randomPerformDelay?: number
      uniqueMessageIds?: number
      cache?: EngageDestinationCache
    }) {
      const allPerformers = Array.from({ length: args?.amount || 100 }, (_, i) => {
        const performer = createPerformer(async () => {
          if (args.randomPerformDelay)
            await new Promise((res) => setTimeout(res, Math.floor(Math.random() * args.randomPerformDelay!)))

          return await args.sendToRecepient?.bind(performer as any)()
        })
        if (args.cache) {
          performer.executeInput.engageDestinationCache = args.cache
          performer.engageDestinationCache = args.cache
        }
        if (args.uniqueMessageIds)
          performer.executeInput.rawData.messageId = 'test-message-id' + (i % args.uniqueMessageIds)
        args.performerInit?.(performer, i)
        return performer
      })
      let result: any[] = []
      if (args.sequentially)
        for (const performer of allPerformers) {
          try {
            result.push(await performer.perform())
          } catch (e) {
            result.push(e)
          }
        }
      else {
        result = (
          await Promise.allSettled(
            allPerformers.map(async (performer) => {
              if (args.randomStartDelay)
                await new Promise((res) => setTimeout(res, Math.floor(Math.random() * args.randomStartDelay!))) //randomize start time
              return await performer.perform()
            })
          )
        ).map((sp) => (sp.status === 'fulfilled' ? sp.value : sp.reason))
      }
      return result
    }

    describe.each([
      ['undefined', undefined],
      ['empty string', ''],
      ['null', null],
      ['boolean false', false],
      ['throw non-retryable error', new IntegrationError('some error', 'NON_RETRYABLE_ERROR', 401)]
    ])('prevent sending & locking twice after first send cached:', (name, valueToCache) => {
      test(name, async () => {
        const sendToRecepient = jest.fn(() => {
          if (valueToCache instanceof Error) throw valueToCache
          else return valueToCache
        })
        const res = await runManyPerformers({
          amount: 2,
          sequentially: true,
          sendToRecepient
        })

        expect(sendToRecepient).toHaveBeenCalledTimes(1)
        expect(cache.getByKey).toHaveBeenCalledTimes(3) // #1 - getOrAdd before locking, #2 - getOrAdd after locking, #3 - getOrAdd for second performer
        expect(res.length).toBe(2)
        expect(res[0]).toEqual(valueToCache)
        if (valueToCache instanceof Error) expect(res[1]).toBeInstanceOf(IntegrationError)
        else expect(res[1]).toEqual({ status: undefined })
      })
      // test(`prevent sending & locking twice if second perform happens after first one cached {}`, async () => {

      // })
    })
    test('prevent caching retryable error', async () => {
      const errorToThrow = new IntegrationError('some retryable error, should not be cached', 'RETRYABLE_ERROR', 500)
      errorToThrow.retry = true
      const sendToRecepient = jest.fn(() => {
        throw errorToThrow
      })
      const res = await runManyPerformers({
        amount: 2,
        sequentially: true,
        sendToRecepient
      })

      expect(sendToRecepient).toHaveBeenCalledTimes(2) //because we don't cache retryable errors
      expect(res[0] == errorToThrow).toBeTruthy()
      expect(res[1] == errorToThrow).toBeTruthy()
    })

    test('prevent sending multiple times during hundred of concurrent calls', async () => {
      const sendToRecepient = jest.fn()
      const uniqueMessageIds = 4
      await runManyPerformers({
        randomPerformDelay: 500,
        randomStartDelay: 500,
        sendToRecepient,
        uniqueMessageIds
      })
      expect(sendToRecepient).toHaveBeenCalledTimes(uniqueMessageIds)
      expect(cache.setByKey).toHaveBeenCalledTimes(uniqueMessageIds)
    })

    test('stats always have withLock tag during concurrent calls', async () => {
      const uniqueMessageIds = 4
      await runManyPerformers({
        randomStartDelay: 500,
        randomPerformDelay: 500,
        uniqueMessageIds,
        performerInit(performer) {
          type IncrFunc = jest.MockedFunction<
            NonNullable<typeof performer.executeInput.statsContext>['statsClient']['incr']
          >
          const incrMock = performer.executeInput.statsContext?.statsClient.incr as IncrFunc
          incrMock.mockImplementation((name, _value, tags) => {
            if (name.startsWith('test-integration.getOrAddCache')) {
              expect(tags!.some((t) => t == 'withLock:true') || tags!.some((t) => t == 'withLock:false')).toBeTruthy()
            }
          })
        }
      })
    })

    test('cache read error leads to retryable error immediately (without send)', async () => {
      const cache = new TestCache()
      cache.getByKey = jest.fn(() => {
        throw new Error('some error while reading cache')
      })
      expect(() => cache.getByKey('any key')).toThrowError()
      const sendToRecepient = jest.fn(() => Promise.resolve(new Date()))
      const res = await runManyPerformers({
        amount: 2,
        sequentially: true,
        sendToRecepient,
        cache
      })

      expect(sendToRecepient).toHaveBeenCalledTimes(0)
      expect(res[0]).toBeInstanceOf(IntegrationError)
      expect(isRetryableError(res[0])).toBeTruthy()
      expect(res[1]).toBeInstanceOf(IntegrationError)
      expect(isRetryableError(res[1])).toBeTruthy()
    })

    test('getOrAddCache should work for nested call (fetching large template)', async () => {
      const template = 'large message template'
      const fetchLargeTemplate = jest.fn(async () => {
        await new Promise((res) => setTimeout(res, 500))
        return template
      })
      const sendToRecepient = jest.fn(async function (this: TestMessageSendPerformer) {
        const template = await this.getOrAddCache('large_message_template', async () => await fetchLargeTemplate(), {
          lockOptions: {
            lockMaxTimeMs: 60_000, //1 min
            acquireLockMaxWaitTimeMs: 500, //1 sec
            acquireLockRetryIntervalMs: 500
          }
        })
        expect(template).toBe(template)
      })
      const res = await runManyPerformers({
        sendToRecepient,
        amount: 10
      })
      expect(fetchLargeTemplate).toHaveBeenCalledTimes(1)
      expect(sendToRecepient).toHaveBeenCalledTimes(1)
      expect(res[0]).not.toBeInstanceOf(Error)
      expect(res[1]).not.toBeInstanceOf(Error)
    })

    test('cache lock write failure should lead to retryable error', async () => {
      const cache = new TestCache()
      cache.setByKeyNX = jest.fn(() => {
        throw new Error('some error while writing lock')
      })
      expect(() => cache.setByKeyNX('any key', 'any value')).toThrowError()
      const sendToRecepient = jest.fn(() => Promise.resolve(new Date()))
      const res = await runManyPerformers({
        amount: 2,
        sequentially: true,
        sendToRecepient,
        cache
      })

      expect(sendToRecepient).toHaveBeenCalledTimes(0)

      expect(res[0]).toBeInstanceOf(IntegrationError)
      expect(res[0].message.includes('some error while writing lock')).toBeTruthy()
      expect(isRetryableError(res[0])).toBeTruthy()

      expect(res[1]).toBeInstanceOf(IntegrationError)
      expect(res[1].message.includes('some error while writing lock')).toBeTruthy()
      expect(isRetryableError(res[1])).toBeTruthy()
    })
  })
})
