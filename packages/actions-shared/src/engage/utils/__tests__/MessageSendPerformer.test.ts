/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ExecuteInput } from '@segment/actions-core/src'
import { MessagePayloadBase, MessageSendPerformer, MessageSettingsBase } from '../MessageSendPerformer'
import { EngageDestinationCache } from '@segment/actions-core/destination-kit'

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

    async function runConcurrently(args: {
      concurrency?: number
      sendToRecepient?: () => Promise<any>
      performerInit?: (performer: Mutable<TestMessageSendPerformer>, index: number) => void
      randomStartDelay?: number
      randomPerformDelay?: number
      uniqueMessageIds?: number
    }) {
      const parallelPerformers = Array.from({ length: args?.concurrency || 100 }, (_, i) => {
        const performer = createPerformer(async () => {
          if (args.randomPerformDelay)
            await new Promise((res) => setTimeout(res, Math.floor(Math.random() * args.randomPerformDelay!)))
          return await args.sendToRecepient?.()
        })
        if (args.uniqueMessageIds)
          performer.executeInput.rawData.messageId = 'test-message-id' + (i % args.uniqueMessageIds)
        args.performerInit?.(performer, i)
        return performer
      })
      await Promise.all(
        parallelPerformers.map(async (performer) => {
          if (args.randomStartDelay)
            await new Promise((res) => setTimeout(res, Math.floor(Math.random() * args.randomStartDelay!))) //randomize start time
          await performer.perform()
        })
      )
    }

    test('prevent sending twice', async () => {
      let performer = createPerformer()
      await performer.perform()
      expect(cache.getByKey).toHaveBeenCalledTimes(2)
      // #1 - getOrAdd before locking
      // #2 - getOrAdd after locking

      expect(performer.sendToRecepient).toHaveBeenCalledTimes(1)
      expect(cache.setByKeyNX).toHaveBeenCalledTimes(1) //during locking

      jest.clearAllMocks()

      performer = createPerformer()
      await performer.perform()
      expect(cache.getByKey).toHaveBeenCalledTimes(1) //only one call to get cache, must not lock, since it's already cached

      expect(performer.sendToRecepient).toHaveBeenCalledTimes(0)
      //
    })

    test('prevent sending multiple times during hundred of concurrent calls', async () => {
      const sendToRecepient = jest.fn()
      const uniqueMessageIds = 4
      await runConcurrently({
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
      await runConcurrently({
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
  })
})
