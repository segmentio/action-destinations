import { Analytics, Context } from '@segment/analytics-next'
import segmentUtility from '../../index'

let ajs: Analytics

describe('throttle', () => {
  beforeEach(async () => {
    ajs = new Analytics({
      writeKey: 'shall_never_be_revealed'
    })
  })

  test('throttles events', async () => {
    const [throttle] = await segmentUtility({
      throttleTime: 3000,
      passThroughRate: 0.5,
      subscriptions: [
        {
          partnerAction: 'throttle',
          name: 'Throttle',
          enabled: true,
          subscribe: 'type = "track"',
          mapping: {}
        }
      ]
    })

    await throttle.load(Context.system(), ajs)
    let ctx = await throttle.track?.(new Context({ type: 'track', event: 'Video Played' }))

    expect(ctx?.event.integrations).not.toBeDefined()

    ctx = await throttle.track?.(new Context({ type: 'track', event: 'Video Played' }))

    expect(ctx?.event.integrations).toBeDefined()
    expect(ctx?.event.integrations?.['Segment.io']).toEqual(false)
  })

  test('throttles multiple events names separately', async () => {
    const [throttle] = await segmentUtility({
      throttleTime: 3000,
      passThroughRate: 0.5,
      subscriptions: [
        {
          partnerAction: 'throttle',
          name: 'Throttle',
          enabled: true,
          subscribe: 'type = "track"',
          mapping: {}
        }
      ]
    })

    await throttle.load(Context.system(), ajs)
    let ctx = await throttle.track?.(new Context({ type: 'track', event: 'Video Played' }))

    expect(ctx?.event.integrations).not.toBeDefined()

    ctx = await throttle.track?.(new Context({ type: 'track', event: 'Video Stopped' }))
    expect(ctx?.event.integrations).not.toBeDefined()

    ctx = await throttle.track?.(new Context({ type: 'track', event: 'Video Played' }))
    expect(ctx?.event.integrations).toBeDefined()
    expect(ctx?.event.integrations?.['Segment.io']).toEqual(false)

    ctx = await throttle.track?.(new Context({ type: 'track', event: 'Video Stopped' }))
    expect(ctx?.event.integrations).toBeDefined()
    expect(ctx?.event.integrations?.['Segment.io']).toEqual(false)
  })

  test('Allow events to pass through at the pass-through rate', async () => {
    // pass through rate of 0.5 means that 50% of events should pass through
    const [throttle] = await segmentUtility({
      throttleTime: 3000,
      passThroughRate: 0.5,
      subscriptions: [
        {
          partnerAction: 'throttle',
          name: 'Throttle',
          enabled: true,
          subscribe: 'type = "track"',
          mapping: {}
        }
      ]
    })

    await throttle.load(Context.system(), ajs)
    let passedThroguh = 0
    for (let i = 0; i < 10; i++) {
      const ctx = await throttle.track?.(new Context({ type: 'track', event: 'Video Played' }))
      if (ctx?.event.integrations?.['Segment.io'] !== false) {
        passedThroguh++
      }
    }

    expect(passedThroguh).toBe(5)

    // pass through rate of 0.1 means that 10% of events should pass through
    const [throttle2] = await segmentUtility({
      throttleTime: 3000,
      passThroughRate: 0.1,
      subscriptions: [
        {
          partnerAction: 'throttle',
          name: 'Throttle',
          enabled: true,
          subscribe: 'type = "track"',
          mapping: {}
        }
      ]
    })

    await throttle2.load(Context.system(), ajs)
    passedThroguh = 0

    for (let i = 0; i < 10; i++) {
      const ctx = await throttle2.track?.(new Context({ type: 'track', event: 'Video Played' }))
      if (ctx?.event.integrations?.['Segment.io'] !== false) {
        passedThroguh++
      }
    }

    expect(passedThroguh).toBe(1)
  })

  test('Preserves the integrations object while flipping the Segment destination to false', async () => {
    const [throttle] = await segmentUtility({
      throttleTime: 3000,
      passThroughRate: 0.5,
      subscriptions: [
        {
          partnerAction: 'throttle',
          name: 'Throttle',
          enabled: true,
          subscribe: 'type = "track"',
          mapping: {}
        }
      ]
    })

    const integrations = {
      All: false,
      'Segment.io': true,
      'Google Analytics': true,
      'Customer.io': true,
      Amplitude: {
        sessionId: 12345
      }
    }

    await throttle.load(Context.system(), ajs)
    let ctx = await throttle.track?.(new Context({ type: 'track', event: 'Video Played', integrations }))

    expect(ctx?.event.integrations).toEqual(integrations)

    ctx = await throttle.track?.(new Context({ type: 'track', event: 'Video Played', integrations }))
    expect(ctx?.event.integrations).toEqual({ ...integrations, 'Segment.io': false })
  })

  test('Time-based throttling', async () => {
    const [throttle] = await segmentUtility({
      throttleTime: 3000,
      passThroughRate: 0,
      subscriptions: [
        {
          partnerAction: 'throttle',
          name: 'Throttle',
          enabled: true,
          subscribe: 'type = "track"',
          mapping: {}
        }
      ]
    })

    await throttle.load(Context.system(), ajs)

    // Canada Day
    jest.spyOn(global.Date, 'now').mockImplementationOnce(() => new Date('2022-07-01T00:00:00.000Z').valueOf())

    let ctx = await throttle.track?.(new Context({ type: 'track', event: 'Video Played' }))

    expect(ctx?.event.integrations).not.toBeDefined()

    // One second later, throttle this event
    jest.spyOn(global.Date, 'now').mockImplementationOnce(() => new Date('2022-07-01T00:00:01.000Z').valueOf())

    ctx = await throttle.track?.(new Context({ type: 'track', event: 'Video Played' }))

    expect(ctx?.event.integrations).toBeDefined()
    expect(ctx?.event.integrations?.['Segment.io']).toEqual(false)

    // Three seconds later, let this event through
    jest.spyOn(global.Date, 'now').mockImplementationOnce(() => new Date('2022-07-01T00:00:03.100Z').valueOf())

    ctx = await throttle.track?.(new Context({ type: 'track', event: 'Video Played' }))
    expect(ctx?.event.integrations).not.toBeDefined()
  })

  test('Only throttles the events that match the subscription', async () => {
    const [throttle] = await segmentUtility({
      throttleTime: 3000,
      passThroughRate: 0,
      subscriptions: [
        {
          partnerAction: 'throttle',
          name: 'Throttle',
          enabled: true,
          subscribe: 'type = "track" and event = "Video Played"',
          mapping: {}
        }
      ]
    })

    await throttle.load(Context.system(), ajs)
    let ctx = await throttle.track?.(new Context({ type: 'track', event: 'Video Played' }))

    expect(ctx?.event.integrations).not.toBeDefined()

    ctx = await throttle.track?.(new Context({ type: 'track', event: 'Video Played' }))
    expect(ctx?.event.integrations).toBeDefined()
    expect(ctx?.event.integrations?.['Segment.io']).toEqual(false)

    ctx = await throttle.track?.(new Context({ type: 'track', event: 'Video Stopped' }))

    expect(ctx?.event.integrations).not.toBeDefined()

    ctx = await throttle.track?.(new Context({ type: 'track', event: 'Video Stopped' }))
    expect(ctx?.event.integrations).not.toBeDefined()
  })
})
