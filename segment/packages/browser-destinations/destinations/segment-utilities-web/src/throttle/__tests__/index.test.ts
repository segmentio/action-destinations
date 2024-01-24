import { Analytics, Context } from '@segment/analytics-next'
import segmentUtilities from '../../index'

let ajs: Analytics

describe('throttle', () => {
  beforeEach(async () => {
    ajs = new Analytics({
      writeKey: 'shall_never_be_revealed'
    })
  })

  test('throttles events', async () => {
    const [throttle] = await segmentUtilities({
      throttleWindow: 3000,
      passThroughCount: 1,
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

  test('does not throttle if no settings provided', async () => {
    const [throttle] = await segmentUtilities({
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

    expect(ctx?.event.integrations).not.toBeDefined()
  })

  test('accept overrides', async () => {
    const [throttle] = await segmentUtilities({
      throttleWindow: 3000,
      passThroughCount: 1,
      subscriptions: [
        {
          partnerAction: 'throttle',
          name: 'Throttle',
          enabled: true,
          subscribe: 'type = "track"',
          mapping: {
            passThroughCount: 2
          }
        }
      ]
    })

    await throttle.load(Context.system(), ajs)
    let ctx = await throttle.track?.(new Context({ type: 'track', event: 'Video Played' }))

    expect(ctx?.event.integrations).not.toBeDefined()

    ctx = await throttle.track?.(new Context({ type: 'track', event: 'Video Played' }))

    expect(ctx?.event.integrations).not.toBeDefined()

    ctx = await throttle.track?.(new Context({ type: 'track', event: 'Video Played' }))

    expect(ctx?.event.integrations).toBeDefined()
    expect(ctx?.event.integrations?.['Segment.io']).toEqual(false)
  })

  test('ignores invalid overrides', async () => {
    const [throttle] = await segmentUtilities({
      throttleWindow: 3000,
      passThroughCount: 1,
      subscriptions: [
        {
          partnerAction: 'throttle',
          name: 'Throttle',
          enabled: true,
          subscribe: 'type = "track"',
          mapping: {
            passThroughCount: {
              '@path': '$.event'
            }
          }
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

  test('does not allow any event to pass through if the pass through count is 0', async () => {
    const [throttle] = await segmentUtilities({
      throttleWindow: 3000,
      passThroughCount: 0,
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

    expect(ctx?.event.integrations).toBeDefined()
    expect(ctx?.event.integrations?.['Segment.io']).toEqual(false)

    ctx = await throttle.track?.(new Context({ type: 'track', event: 'Video Played' }))

    expect(ctx?.event.integrations).toBeDefined()
    expect(ctx?.event.integrations?.['Segment.io']).toEqual(false)
  })

  test('throttles multiple events names separately', async () => {
    const [throttle] = await segmentUtilities({
      throttleWindow: 3000,
      passThroughCount: 1,
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

  test('Allow n events to pass through during the window', async () => {
    const [throttle] = await segmentUtilities({
      throttleWindow: 3000,
      passThroughCount: 3,
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
    let passedThrough = 0
    for (let i = 0; i < 10; i++) {
      const ctx = await throttle.track?.(new Context({ type: 'track', event: 'Video Played' }))
      if (ctx?.event.integrations?.['Segment.io'] !== false) {
        passedThrough++
      }
    }

    expect(passedThrough).toBe(3)

    const [throttle2] = await segmentUtilities({
      throttleWindow: 3000,
      passThroughCount: 8,
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
    passedThrough = 0

    for (let i = 0; i < 10; i++) {
      const ctx = await throttle2.track?.(new Context({ type: 'track', event: 'Video Played' }))
      if (ctx?.event.integrations?.['Segment.io'] !== false) {
        passedThrough++
      }
    }

    expect(passedThrough).toBe(8)
  })

  test('Preserves the integrations object while flipping the Segment destination to false', async () => {
    const [throttle] = await segmentUtilities({
      throttleWindow: 3000,
      passThroughCount: 1,
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
    const [throttle] = await segmentUtilities({
      throttleWindow: 3000,
      passThroughCount: 1,
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

  test('Complex Time-based throttling', async () => {
    const [throttle] = await segmentUtilities({
      throttleWindow: 3000,
      passThroughCount: 2,
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

    // One second later, still allowed because of the passThroughCount
    jest.spyOn(global.Date, 'now').mockImplementationOnce(() => new Date('2022-07-01T00:00:01.000Z').valueOf())
    ctx = await throttle.track?.(new Context({ type: 'track', event: 'Video Played' }))
    expect(ctx?.event.integrations).not.toBeDefined()

    // One second later, throttle this event
    jest.spyOn(global.Date, 'now').mockImplementationOnce(() => new Date('2022-07-01T00:00:02.000Z').valueOf())
    ctx = await throttle.track?.(new Context({ type: 'track', event: 'Video Played' }))
    expect(ctx?.event.integrations).toBeDefined()
    expect(ctx?.event.integrations?.['Segment.io']).toEqual(false)

    // One second later, window expired, let this event through
    jest.spyOn(global.Date, 'now').mockImplementationOnce(() => new Date('2022-07-01T00:00:03.100Z').valueOf())
    ctx = await throttle.track?.(new Context({ type: 'track', event: 'Video Played' }))
    expect(ctx?.event.integrations).not.toBeDefined()
  })

  test('Only throttles the events that match the subscription', async () => {
    const [throttle] = await segmentUtilities({
      throttleWindow: 3000,
      passThroughCount: 1,
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
