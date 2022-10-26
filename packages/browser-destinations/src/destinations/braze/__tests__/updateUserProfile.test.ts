import { Analytics, Context } from '@segment/analytics-next'
import brazeDestination, { destination } from '../index'

describe('updateUserProfile', () => {
  const subscriptions = [
    {
      partnerAction: 'updateUserProfile',
      name: 'Update User Profile',
      enabled: true,
      subscribe: 'type = "identify"',
      mapping: {
        country: { '@path': '$.traits.country' },
        current_location: { '@path': '$.traits.current_location' },
        custom_attributes: { '@path': '$.traits.custom_attributes' },
        dob: { '@path': '$.traits.dob' },
        email: { '@path': '$.traits.email' },
        email_subscribe: { '@path': '$.traits.email_subscribe' },
        first_name: { '@path': '$.traits.first_name' },
        gender: { '@path': '$.traits.gender' },
        home_city: { '@path': '$.traits.home_city' },
        image_url: { '@path': '$.traits.image_url' },
        language: { '@path': '$.traits.language' },
        last_name: { '@path': '$.traits.last_name' },
        phone: { '@path': '$.traits.phone' },
        push_subscribe: { '@path': '$.traits.push_subscribe' }
      }
    }
  ]

  beforeEach(async () => {
    destination.actions.updateUserProfile.perform = jest.fn()
    jest.spyOn(destination.actions.trackEvent, 'perform')
    jest.spyOn(destination, 'initialize')
  })

  test('changes the external_id when present', async () => {
    const [event] = await brazeDestination({
      api_key: 'b_123',
      endpoint: 'endpoint',
      sdkVersion: '3.5',
      doNotLoadFontAwesome: true,
      subscriptions: [
        {
          partnerAction: 'updateUserProfile',
          name: 'Log User',
          enabled: true,
          subscribe: 'type = "identify"',
          mapping: {
            external_id: {
              '@path': '$.traits.external_id'
            }
          }
        }
      ]
    })

    await event.load(Context.system(), new Analytics({ writeKey: '123' }))
    await event.identify?.(
      new Context({
        type: 'identify',
        traits: {
          external_id: 'xt_123'
        }
      })
    )

    expect(destination.actions.updateUserProfile.perform).toHaveBeenCalledWith(
      expect.objectContaining({
        instance: expect.objectContaining({
          changeUser: expect.any(Function)
        })
      }),

      expect.objectContaining({
        payload: { external_id: 'xt_123' }
      })
    )
  })

  test('can change user traits', async () => {
    const [event] = await brazeDestination({
      api_key: 'b_123',
      endpoint: 'endpoint',
      sdkVersion: '3.5',
      doNotLoadFontAwesome: true,
      subscriptions
    })

    await event.load(Context.system(), {} as Analytics)
    await event.identify?.(
      new Context({
        type: 'identify',
        traits: {
          external_id: 'xt_123',
          country: 'BRA',
          current_location: {
            latitude: -23.54,
            longitude: -46.65
          },
          custom_attributes: {
            greeting: 'oi'
          },
          dob: '01/01/2000',
          email: 'foo@example.org',
          email_subscribe: true,
          first_name: 'Foo',
          gender: 'M',
          home_city: 'Miami',
          image_url: 'img_url',
          language: 'english',
          last_name: 'Bar',
          phone: '555 5555',
          push_subscribe: true
        }
      })
    )

    expect(destination.actions.updateUserProfile.perform).toHaveBeenCalledWith(
      expect.objectContaining({
        instance: expect.objectContaining({
          changeUser: expect.any(Function)
        })
      }),

      expect.objectContaining({
        payload: {
          country: 'BRA',
          current_location: { latitude: -23.54, longitude: -46.65 },
          custom_attributes: { greeting: 'oi' },
          dob: '01/01/2000',
          email: 'foo@example.org',
          email_subscribe: true,
          first_name: 'Foo',
          gender: 'M',
          home_city: 'Miami',
          image_url: 'img_url',
          language: 'english',
          last_name: 'Bar',
          phone: '555 5555',
          push_subscribe: true
        }
      })
    )
  })
})
