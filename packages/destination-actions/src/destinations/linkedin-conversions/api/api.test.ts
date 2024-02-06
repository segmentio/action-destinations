import nock from 'nock'
import createRequestClient from '../../../../../core/src/create-request-client'
import { LinkedInConversions } from '../api'
import { BASE_URL } from '../constants'

const requestClient = createRequestClient()

describe('LinkedIn Conversions', () => {
  describe('dynamicFields', () => {
    const linkedIn: LinkedInConversions = new LinkedInConversions(requestClient)

    it('should fetch a list of ad accounts, with their names', async () => {
      nock(`${BASE_URL}`)
        .get(`/adAccounts`)
        .query({ q: 'search' })
        .reply(200, {
          elements: [
            {
              test: false,
              notifiedOnCreativeRejection: true,
              notifiedOnNewFeaturesEnabled: true,
              notifiedOnEndOfCampaign: true,
              notifiedOnCampaignOptimization: true,
              type: 'BUSINESS',
              version: {
                versionTag: '6'
              },
              reference: 'urn:li:organization:1122334',
              notifiedOnCreativeApproval: false,
              changeAuditStamps: {
                created: {
                  actor: 'urn:li:unknown:0',
                  time: 1498178296000
                },
                lastModified: {
                  actor: 'urn:li:unknown:0',
                  time: 1696277984515
                }
              },
              name: 'Test Ad Account',
              currency: 'USD',
              id: 101100090,
              status: 'ACTIVE'
            },
            {
              test: false,
              notifiedOnCreativeRejection: false,
              notifiedOnNewFeaturesEnabled: false,
              notifiedOnEndOfCampaign: false,
              notifiedOnCampaignOptimization: false,
              type: 'BUSINESS',
              version: {
                versionTag: '4'
              },
              reference: 'urn:li:organization:1122334',
              notifiedOnCreativeApproval: false,
              changeAuditStamps: {
                created: {
                  actor: 'urn:li:unknown:0',
                  time: 1687394995000
                },
                lastModified: {
                  actor: 'urn:li:unknown:0',
                  time: 1694040316291
                }
              },
              name: 'Krusty Krab Ads',
              currency: 'USD',
              id: 998877665,
              status: 'ACTIVE'
            }
          ],
          paging: {
            count: 1000,
            links: [],
            start: 0,
            total: 2
          }
        })

      const getAdAccountsRes = await linkedIn.getAdAccounts()
      expect(getAdAccountsRes).toEqual({
        choices: [
          {
            label: 'Test Ad Account',
            value: 'urn:li:sponsoredAccount:101100090'
          },
          {
            label: 'Krusty Krab Ads',
            value: 'urn:li:sponsoredAccount:998877665'
          }
        ]
      })
    })

    it('should fetch a list of conversion rules', async () => {
      const payload = {
        adAccountId: '123456'
      }
      nock(`${BASE_URL}`)
        .get(`/conversions`)
        .query({ q: 'account', account: payload.adAccountId, start: 0, count: 100 })
        .reply(200, {
          elements: [
            {
              postClickAttributionWindowSize: 30,
              viewThroughAttributionWindowSize: 7,
              created: 1563230311551,
              type: 'LEAD',
              enabled: true,
              name: 'Conversion API Segment 2',
              lastModified: 1563230311551,
              id: 104012,
              attributionType: 'LAST_TOUCH_BY_CAMPAIGN',
              conversionMethod: 'CONVERSIONS_API',
              account: 'urn:li:sponsoredAccount:51234560'
            },
            {
              postClickAttributionWindowSize: 30,
              viewThroughAttributionWindowSize: 7,
              created: 1563230255308,
              type: 'PURCHASE',
              enabled: true,
              name: 'Conversion API Segment 3',
              lastModified: 1563230265652,
              id: 104004,
              attributionType: 'LAST_TOUCH_BY_CAMPAIGN',
              conversionMethod: 'CONVERSIONS_API',
              account: 'urn:li:sponsoredAccount:51234560'
            }
          ]
        })

      const getConversionRulesListRes = await linkedIn.getConversionRulesList(payload.adAccountId)
      expect(getConversionRulesListRes).toEqual({
        choices: [
          {
            label: 'Conversion API Segment 2',
            value: 104012
          },
          {
            label: 'Conversion API Segment 3',
            value: 104004
          }
        ]
      })
    })

    it('should fetch a list of campaigns', async () => {
      const payload = {
        adAccountId: '123456'
      }
      nock(`${BASE_URL}`)
        .get(`/adAccounts/${payload.adAccountId}/adCampaigns?q=search&search=(status:(values:List(ACTIVE,DRAFT)))`)
        .reply(200, {
          paging: {
            start: 0,
            count: 10,
            links: [],
            total: 1
          },
          elements: [
            {
              test: false,
              storyDeliveryEnabled: false,
              format: 'TEXT_AD',
              targetingCriteria: {
                include: {
                  and: [
                    {
                      or: {
                        'urn:li:adTargetingFacet:locations': ['urn:li:geo:90000084']
                      }
                    },
                    {
                      or: {
                        'urn:li:adTargetingFacet:interfaceLocales': ['urn:li:locale:en_US']
                      }
                    }
                  ]
                }
              },
              servingStatuses: ['ACCOUNT_SERVING_HOLD'],
              locale: {
                country: 'US',
                language: 'en'
              },
              type: 'TEXT_AD',
              version: {
                versionTag: '11'
              },
              objectiveType: 'WEBSITE_TRAFFIC',
              associatedEntity: 'urn:li:organization:2425698',
              optimizationTargetType: 'NONE',
              runSchedule: {
                start: 1498178362345
              },
              changeAuditStamps: {
                created: {
                  actor: 'urn:li:unknown:0',
                  time: 1498178304000
                },
                lastModified: {
                  actor: 'urn:li:unknown:0',
                  time: 1698494362000
                }
              },
              campaignGroup: 'urn:li:sponsoredCampaignGroup:600360846',
              dailyBudget: {
                currencyCode: 'USD',
                amount: '25'
              },
              costType: 'CPC',
              creativeSelection: 'OPTIMIZED',
              unitCost: {
                currencyCode: 'USD',
                amount: '8.19'
              },
              name: 'Test',
              offsiteDeliveryEnabled: false,
              id: 125868226,
              audienceExpansionEnabled: true,
              account: 'urn:li:sponsoredAccount:507525021',
              status: 'ACTIVE'
            }
          ]
        })

      const getCampaignsListRes = await linkedIn.getCampaignsList(payload.adAccountId)
      expect(getCampaignsListRes).toEqual({
        choices: [
          {
            label: 'Test',
            value: 125868226
          }
        ]
      })
    })
  })
})
