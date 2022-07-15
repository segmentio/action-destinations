import { Analytics, Context } from '@segment/analytics-next'
import intercomDestination, { destination } from '../../index'


const subscriptions: Subscription[] = [
  {
    partnerAction: "updateCompany",
    name: "Show",
    enabled: true,
    subscribe: "type = \"group\"",
    mapping: {
       company: {
          company_id: {"@path": "$.groupId"},
          company_custom_traits: { "@path": "$.traits"},
          name: {"@path": "$.traits.name"},
          plan: {"@path": "$.traits.plan"},
          monthly_spend: {"@path": "$.traits.monthlySpend"},
          created_at: {"@path": "$.traits.createdAt"},
          size: {"@path": "$.traits.size"},
          website: {"@path": "$.traits.website"},
          industry: {"@path": "$.traits.industry"}
       },
       hide_default_launcher: {
          "@path": "$.context.Intercom.hideDefaultLauncher"
       }
    }
   }
]

describe('Intercom.update (Company)', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  test('sends an id', async () => {
    const [updateCompany] = await intercomDestination({
      appId: 'superSecretAppID',
      subscriptions
    })

    jest.spyOn(destination.actions.updateCompany, 'perform').mockImplementation
  })
})
