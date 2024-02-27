import { Analytics, Context } from '@segment/analytics-next'
import adobeTarget, { destination } from '../../index'
import { Subscription } from '@segment/browser-destination-runtime/types'

describe('Adobe Target Web', () => {
  describe('#identify', () => {
    test('calls identify and simulates a login flow', async () => {
      const subscriptions: Subscription[] = [
        {
          partnerAction: 'upsertProfile',
          name: 'Upsert Profile',
          enabled: true,
          subscribe: 'type = "identify"',
          mapping: {
            userId: {
              '@if': {
                exists: {
                  '@path': '$.userId'
                },
                then: {
                  '@path': '$.userId'
                },
                else: {
                  '@path': '$.anonymousId'
                }
              }
            },
            traits: {
              '@path': '$.traits'
            }
          }
        }
      ]

      const targetSettings = {
        client_code: 'segmentexchangepartn',
        admin_number: '10',
        version: '2.8.0',
        cookie_domain: 'segment.com',
        mbox_name: 'target-global-mbox'
      }

      const identifyParams = {
        traits: {
          favorite_color: 'blue',
          location: {
            country_code: 'MX',
            state: 'Mich'
          }
        }
      }

      const [event] = await adobeTarget({
        ...targetSettings,
        subscriptions
      })

      jest.spyOn(destination, 'initialize')

      destination.actions.upsertProfile.perform = jest.fn(destination.actions.upsertProfile.perform)

      await event.load(Context.system(), {} as Analytics)
      expect(destination.initialize).toHaveBeenCalled()

      await event.identify?.(
        new Context({
          anonymousId: 'random-id-42',
          type: 'identify',
          ...identifyParams
        })
      )

      expect(destination.actions.upsertProfile.perform).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          payload: {
            userId: 'random-id-42',
            traits: {
              favorite_color: 'blue',
              location: {
                country_code: 'MX',
                state: 'Mich'
              }
            }
          }
        })
      )

      expect(window.pageParams).toEqual({
        mbox3rdPartyId: 'random-id-42',
        profile: {
          favorite_color: 'blue',
          location: {
            country_code: 'MX',
            state: 'Mich'
          }
        }
      })

      await event.identify?.(
        new Context({
          userId: 'The-Real-ID',
          anonymousId: 'random-id-42',
          type: 'identify',
          ...identifyParams
        })
      )

      expect(destination.actions.upsertProfile.perform).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          payload: {
            userId: 'The-Real-ID',
            traits: {
              favorite_color: 'blue',
              location: {
                country_code: 'MX',
                state: 'Mich'
              }
            }
          }
        })
      )

      expect(window.pageParams).toEqual({
        mbox3rdPartyId: 'The-Real-ID',
        profile: {
          favorite_color: 'blue',
          location: {
            country_code: 'MX',
            state: 'Mich'
          }
        }
      })
    })
  })
})
