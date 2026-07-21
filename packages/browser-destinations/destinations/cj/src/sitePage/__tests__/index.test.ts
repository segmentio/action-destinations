import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import CJDestination, { destination } from '../../index'
import { CJ } from '../../types'
import * as sendModule from '../../utils'
import * as sitePageModule from '../utils'

describe('CJ init', () => {
  const settings = {
    tagId: '123456789',
    actionTrackerId: '987654321'
  }

  let mockCJ: CJ
  let sitePageEvent: any
  beforeEach(async () => {
    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      mockCJ = {} as CJ
      return Promise.resolve(mockCJ)
    })

    jest.spyOn(sendModule, 'send').mockImplementation(() => {
      return Promise.resolve()
    })

    jest.spyOn(sitePageModule, 'setSitePageJSON')
    
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('CJ pixel sitePage event', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'sitePage',
        name: 'sitePage',
        enabled: true,
        subscribe: 'type = "page"',
        mapping: {
          userId: { '@path': '$.userId' },
          enterpriseId: 999999,
          pageType: 'homepage',
          referringChannel: { '@path': '$.properties.referring_channel' },
          cartSubtotal: { '@path': '$.properties.sub_total' },
          items: {
            '@arrayPath': [
              '$.properties.products',
              {
                itemPrice: { '@path': '$.price' },
                itemId: { '@path': '$.id' },
                quantity: { '@path': '$.quantity' },
                discount: { '@path': '$.discount' }
              }
            ]
          }
        }
      }
    ]
    const context = new Context({
      type: 'page',
      userId: 'userId-abc123',
      properties: {
        referring_channel: 'Email',
        sub_total: 10.99,
        products: [
          {
            id: '123',
            quantity: 1,
            price: 1,
            discount: 0.5
          },
          {
            id: '456',
            quantity: 2,
            price: 2,
            discount: 0
          }
        ]
      }
    })
    const [event] = await CJDestination({
      ...settings,
      subscriptions
    })

    const sitePageJSON = {
        userId: 'userId-abc123',
        enterpriseId: 999999,
        pageType: 'homepage',
        referringChannel: 'Email',
        cartSubtotal: 10.99,
        items:[
          {
            itemId: '123',
            quantity: 1,
            itemPrice: 1,
            discount: 0.5
          },
          {
            itemId: '456',
            quantity: 2,
            itemPrice: 2,
            discount: 0
          }
        ]
    }

    sitePageEvent = event
    const sendSpy = jest.spyOn(sendModule, 'send').mockResolvedValue(undefined)
    await sitePageEvent.load(Context.system(), {} as Analytics)
    await sitePageEvent.track?.(context)
    expect(destination.initialize).toHaveBeenCalled()
    expect(sitePageModule.setSitePageJSON).toHaveBeenCalled()
    expect(sitePageModule.setSitePageJSON).toHaveBeenCalledWith(
      expect.any(Object), 
      expect.objectContaining(sitePageJSON)
    )
    expect(sendSpy).toHaveBeenCalledWith('123456789') 
    expect(mockCJ.sitePage).toBe(undefined)
    expect(mockCJ.order).toBe(undefined)
  })
})
