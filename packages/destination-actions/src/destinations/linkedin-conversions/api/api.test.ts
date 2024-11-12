import nock from 'nock'
import createRequestClient from '../../../../../core/src/create-request-client'
import { LinkedInConversions } from '../api'
import { BASE_URL } from '../constants'
import { HookBundle } from '../streamConversion/generated-types'

const requestClient = createRequestClient()

describe('LinkedIn Conversions', () => {
  describe('conversionRule methods', () => {
    const linkedIn: LinkedInConversions = new LinkedInConversions(requestClient)
    const adAccountId = 'urn:li:sponsoredAccount:123456'
    const hookInputs: HookBundle['onMappingSave']['inputs'] = {
      adAccountId,
      name: 'A different name that should trigger an update',
      conversionType: 'PURCHASE',
      attribution_type: 'LAST_TOUCH_BY_CAMPAIGN',
      post_click_attribution_window_size: 30,
      view_through_attribution_window_size: 7
    }

    const hookOutputs: HookBundle['onMappingSave']['outputs'] = {
      id: '56789',
      name: 'The original name',
      conversionType: 'LEAD',
      attribution_type: 'LAST_TOUCH_BY_CONVERSION',
      post_click_attribution_window_size: 30,
      view_through_attribution_window_size: 7
    }

    it('should update a conversion rule', async () => {
      nock(`${BASE_URL}`)
        .post(`/conversions/${hookOutputs.id}`, {
          patch: {
            $set: {
              name: hookInputs.name,
              type: hookInputs.conversionType,
              attributionType: hookInputs.attribution_type
            }
          }
        })
        .query({
          account: adAccountId
        })
        .reply(204)

      const updateResult = await linkedIn.updateConversionRule(hookInputs, hookOutputs)

      expect(updateResult).toEqual({
        successMessage: `Conversion rule ${hookOutputs.id} updated successfully!`,
        savedData: {
          id: hookOutputs.id,
          name: hookInputs.name,
          conversionType: hookInputs.conversionType,
          attribution_type: hookInputs.attribution_type,
          post_click_attribution_window_size: hookOutputs.post_click_attribution_window_size,
          view_through_attribution_window_size: hookOutputs.view_through_attribution_window_size
        }
      })
    })

    it('should create a conversion rule', async () => {
      const mockReturnedId = '12345'

      nock(`${BASE_URL}`)
        .post(`/conversions`, {
          name: hookInputs.name,
          account: adAccountId,
          conversionMethod: 'CONVERSIONS_API',
          postClickAttributionWindowSize: hookInputs.post_click_attribution_window_size,
          viewThroughAttributionWindowSize: hookInputs.view_through_attribution_window_size,
          attributionType: hookInputs.attribution_type,
          type: hookInputs.conversionType
        })
        .reply(201, {
          id: mockReturnedId,
          name: hookInputs.name,
          type: hookInputs.conversionType,
          attributionType: hookInputs.attribution_type,
          postClickAttributionWindowSize: hookInputs.post_click_attribution_window_size,
          viewThroughAttributionWindowSize: hookInputs.view_through_attribution_window_size
        })
      const createResult = await linkedIn.createConversionRule(hookInputs)

      expect(createResult).toEqual({
        successMessage: `Conversion rule ${mockReturnedId} created successfully!`,
        savedData: {
          id: mockReturnedId,
          name: hookInputs.name,
          conversionType: hookInputs.conversionType,
          attribution_type: hookInputs.attribution_type,
          post_click_attribution_window_size: hookInputs.post_click_attribution_window_size,
          view_through_attribution_window_size: hookInputs.view_through_attribution_window_size
        }
      })
    })

    it('should use the existing conversionRuleId if passed in and not update anything', async () => {
      const existingRule = {
        id: '5678',
        name: 'Exists already',
        type: 'PURCHASE',
        attributionType: 'LAST_TOUCH_BY_CAMPAIGN',
        postClickAttributionWindowSize: 1,
        viewThroughAttributionWindowSize: 1
      }

      nock(`${BASE_URL}`)
        .get(`/conversions/${existingRule.id}`)
        .query({ account: adAccountId })
        .reply(200, existingRule)

      const updateResult = await linkedIn.updateConversionRule(
        { ...hookInputs, conversionRuleId: existingRule.id },
        hookOutputs
      )

      expect(updateResult).toEqual({
        successMessage: `Using existing Conversion Rule: ${existingRule.id} `,
        savedData: {
          id: existingRule.id,
          name: existingRule.name,
          conversionType: existingRule.type,
          attribution_type: existingRule.attributionType,
          post_click_attribution_window_size: existingRule.postClickAttributionWindowSize,
          view_through_attribution_window_size: existingRule.viewThroughAttributionWindowSize
        }
      })
    })

    it('should pass back an error and the existing savedData if the update request fails', async () => {
      nock(`${BASE_URL}`)
        .post(`/conversions/${hookOutputs.id}`, {
          patch: {
            $set: {
              name: hookInputs.name,
              type: hookInputs.conversionType,
              attributionType: hookInputs.attribution_type
            }
          }
        })
        .query({
          account: adAccountId
        })
        .reply(500)

      const updateResult = await linkedIn.updateConversionRule(hookInputs, hookOutputs)

      expect(updateResult).toEqual({
        error: {
          message: `Failed to update conversion rule: Internal Server Error`,
          code: 'CONVERSION_RULE_UPDATE_FAILURE'
        },
        savedData: {
          id: hookOutputs.id,
          name: hookOutputs.name,
          conversionType: hookOutputs.conversionType,
          attribution_type: hookOutputs.attribution_type,
          post_click_attribution_window_size: hookOutputs.post_click_attribution_window_size,
          view_through_attribution_window_size: hookOutputs.view_through_attribution_window_size
        }
      })
    })
  })
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
