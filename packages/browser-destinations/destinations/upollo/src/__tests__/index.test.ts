import { Analytics, Context } from '@segment/analytics-next'
import plugin, { destination } from '..'

it('should init', async () => {
  const [event] = await plugin({
    apiKey: '123',

    subscriptions: [
      {
        enabled: true,
        name: 'Identify',
        subscribe: 'type = "identify"',
        partnerAction: 'identifyUser',
        mapping: {}
      }
    ]
  })

  jest.spyOn(destination, 'initialize')

  await event.load(Context.system(), {} as Analytics)
  expect(destination.initialize).toHaveBeenCalled()
  expect(window).toHaveProperty('upollo')
})
