import { Analytics, Context } from '@segment/analytics-next'
import stackadapt, { destination } from '..'

describe('StackAdapt', () => {
  test('can track page views', async () => {
    const [trackPage] = await stackadapt({
      universalPixelId: 'test',
      subscriptions: [
        {
          enabled: true,
          name: 'Track Page',
          subscribe: 'type = "page"',
          partnerAction: 'trackPage',
          mapping: {
            properties: {
              '@path': '$.properties'
            }
          }
        }
      ]
    })

    destination.actions.trackPage.perform = jest.fn()
    jest.spyOn(destination.actions.trackPage, 'perform')
    jest.spyOn(destination, 'initialize')

    await trackPage.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()
    await trackPage.page?.(
      new Context({
        type: 'page',
        properties: {
          title: 'stackadapt.com'
        }
      })
    )

    expect(destination.actions.trackPage.perform).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        payload: {
          properties: {
            title: 'stackadapt.com'
          }
        }
      })
    )
  })
})
