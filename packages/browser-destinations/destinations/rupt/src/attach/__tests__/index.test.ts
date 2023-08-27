import { Analytics, Context } from '@segment/analytics-next'
import rupt from '../../index'

describe('Rupt', () => {
  it('should attach a device', async () => {
    const TEST_USER_ID = 'segment-unit-test-user-id'
    const TEST_USER_EMAIL = 'unit-test+segment@rupt.dev'
    const TEST_USER_PHONE = '555-555-5555'
    const TEST_METADATA = { url: 'https://segment.com', source: 'segment' }

    const [event] = await rupt({
      client_id: 'bf9ce83b-d44b-4da2-97df-1094decbdd56',

      subscriptions: [
        {
          enabled: true,
          name: 'Attach Device',
          subscribe: 'type = "page"',
          partnerAction: 'attach',
          mapping: {
            account: {
              '@path': '$.userId'
            },
            email: {
              '@if': {
                exists: { '@path': '$.traits.email' },
                then: { '@path': '$.traits.email' },
                else: { '@path': '$.email' }
              }
            },
            phone: {
              '@if': {
                exists: { '@path': '$.traits.phone' },
                then: { '@path': '$.traits.phone' },
                else: { '@path': '$.properties.phone' }
              }
            },
            metadata: {
              '@path': '$.properties.metadata'
            }
          }
        }
      ]
    })

    await event.load(Context.system(), {} as Analytics)
    const attach = jest.spyOn(window.Rupt, 'attach')
    await event.page?.(
      new Context({
        type: 'page',
        event: 'Page Viewed - test',
        userId: TEST_USER_ID,
        traits: {
          email: TEST_USER_EMAIL
        },
        properties: {
          phone: TEST_USER_PHONE,
          metadata: TEST_METADATA
        }
      })
    )
    expect(attach).toHaveBeenCalledWith({
      client_id: 'bf9ce83b-d44b-4da2-97df-1094decbdd56',
      account: TEST_USER_ID,
      email: TEST_USER_EMAIL,
      phone: TEST_USER_PHONE,
      metadata: TEST_METADATA,
      include_page: undefined,
      redirect_urls: {
        logout_url: undefined,
        new_account_url: undefined,
        success_url: undefined,
        suspended_url: undefined
      }
    })
  })
})
