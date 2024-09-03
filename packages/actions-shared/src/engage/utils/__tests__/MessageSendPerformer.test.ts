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
      settings: {},
      payload: {
        externalIds: [
          { channelType: 'test-channel', id: 'test-external-id', subscriptionStatus: 'subscribed', type: 'test-type' }
        ],
        send: true
      },
      rawData: {
        messageId: 'test-message-id'
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

    test('prevent calling send twice', async () => {
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

    test('parallel calls', async () => {
      let sends = 0
      const parallelPerformers = Array.from({ length: 100 }, (_, _i) =>
        createPerformer(async () => {
          await new Promise((res) => setTimeout(res, 1000))
          sends++
          return
        })
      )
      await Promise.allSettled(parallelPerformers.map((performer) => performer.perform()))
      expect(sends).toBe(1)
      expect(cache.setByKey).toHaveBeenCalledTimes(1)
    })
  })
})
