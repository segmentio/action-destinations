import { Analytics, Context } from '@segment/analytics-next'
import plugins, { destination } from '../index'

describe('Rupt', () => {
  it('should load Rupt script', async () => {
    const [event] = await plugins({
      client_id: '123',

      subscriptions: [
        {
          enabled: true,
          name: 'Attach Device',
          subscribe: 'type = "page"',
          partnerAction: 'attach',
          mapping: {
            metadata: { unitTest: 'true' }
          }
        }
      ]
    })

    jest.spyOn(destination, 'initialize')

    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()
    expect(window).toHaveProperty('Rupt')
  })
})
