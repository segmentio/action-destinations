import { Analytics, Context } from '@segment/analytics-next'
import trackGoalObject from '../index'
import wisepopsDestination from '../../index'
import { Subscription } from '@segment/browser-destination-runtime/types'

import { loadScript } from '@segment/browser-destination-runtime/load-script'
jest.mock('@segment/browser-destination-runtime/load-script')
beforeEach(async () => {
  // Prevent Wisepops SDK from being loaded.
  ;(loadScript as jest.Mock).mockResolvedValue(true)
})

describe('Wisepops.trackGoal', () => {
  const subscriptions: Subscription[] = [
    {
      partnerAction: 'trackGoal',
      name: trackGoalObject.title,
      enabled: true,
      subscribe: trackGoalObject.defaultSubscription!,
      mapping: {
        goalName: {
          '@path': '$.properties.goalName'
        },
        goalRevenue: {
          '@path': '$.properties.revenue'
        }
      }
    }
  ]

  test('old named goal with revenue', async () => {
    const [trackGoal] = await wisepopsDestination({
      websiteId: '1234567890',
      subscriptions
    } as any)
    expect(trackGoal).toBeDefined()

    await trackGoal.load(Context.system(), {} as Analytics)
    jest.spyOn(window.wisepops.q as any, 'push')

    const context = new Context({
      type: 'track',
      event: 'Order Completed',
      properties: {
        goalName: 'Order Completed',
        revenue: 15
      }
    })
    await trackGoal.track?.(context)

    expect(window.wisepops.q.push).toHaveBeenCalledWith(['goal', 'Order Completed', 15])
  })

  test('new goal with revenue', async () => {
    const [trackGoal] = await wisepopsDestination({
      websiteId: '1234567890',
      subscriptions
    } as any)
    expect(trackGoal).toBeDefined()

    await trackGoal.load(Context.system(), {} as Analytics)
    jest.spyOn(window.wisepops.q as any, 'push')

    const context = new Context({
      type: 'track',
      event: 'Order Completed',
      properties: {
        goalName: 'yhqnj9RTF3Fk6TnTmRW6vhxiugipbUKc',
        revenue: 15
      }
    })
    await trackGoal.track?.(context)

    expect(window.wisepops.q.push).toHaveBeenCalledWith(['goal', 'yhqnj9RTF3Fk6TnTmRW6vhxiugipbUKc', { revenue: 15 }])
  })
})
