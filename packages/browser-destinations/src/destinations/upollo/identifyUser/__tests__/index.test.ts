import { Analytics, Context } from '@segment/analytics-next'

import identify from '..'
import { UpolloClient } from '../../types'
import { Payload } from '../generated-types'

it('should identify', async () => {
  const client = {
    track: jest.fn()
  } as any as UpolloClient

  await identify.perform(client as any as UpolloClient, {
    settings: { apiKey: '123' },
    analytics: jest.fn() as any as Analytics,
    context: new Context({
      type: 'identify',
      event: 'Signed Up'
    }),
    payload: {
      user_id: 'u1',
      email: 'foo@bar.com',
      phone: '+611231234',
      name: 'Mr Foo',
      avatar_image_url: 'http://smile',
      custom_traits: {
        DOB: '1990-01-01',
        Plan: 'Bronze',
        session: {
          // session is excluded because its not a string
          count: 1
        }
      }
    } as Payload
  })

  expect(client.track).toHaveBeenCalledWith({
    userId: 'u1',
    userEmail: 'foo@bar.com',
    userPhone: '+611231234',
    userName: 'Mr Foo',
    userImage: 'http://smile',
    customerSuppliedValues: { DOB: '1990-01-01', Plan: 'Bronze' }
  })
})
