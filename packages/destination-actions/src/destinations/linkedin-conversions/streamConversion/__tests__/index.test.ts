import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { DynamicFieldResponse } from '@segment/actions-core'
import { BASE_URL } from '../../constants'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const event = createTestEvent({
  event: 'Example Event',
  type: 'track',
  timestamp: `${Date.now()}`,
  context: {
    traits: {
      email: 'testing@testing.com',
      user: {
        userIds: [
          {
            idType: 'SHA256_EMAIL',
            idValue: 'bad8677b6c86f5d308ee82786c183482a5995f066694246c58c4df37b0cc41f1'
          },
          {
            idType: 'LINKEDIN_FIRST_PARTY_ADS_TRACKING_UUID',
            idValue: 'df5gf5-gh6t7-ph4j7h-fgf6n1'
          }
        ],
        userInfo: {
          firstName: 'mike',
          lastName: 'smith',
          title: 'software engineer',
          companyName: 'microsoft',
          countryCode: 'US'
        }
      }
    }
  }
})

const settings = {}
const payload = {
  campaignId: ['56789'],
  adAccountId: '12345',
  conversionId: 789123
}

describe('LinkedinConversions.streamConversion', () => {
  it('should successfully send the event', async () => {
    const associateCampignToConversion = {
      campaign: 'urn:li:sponsoredCampaign:123456`',
      conversion: 'urn:lla:llaPartnerConversion:789123'
    }

    const streamConversionEvent = {
      conversion: `urn:lla:llaPartnerConversion:${payload.conversionId}`,
      conversionHappenedAt: Date.now(),
      user: {
        userIds: [
          {
            idType: 'SHA256_EMAIL',
            idValue: 'bad8677b6c86f5d308ee82786c183482a5995f066694246c58c4df37b0cc41f1'
          },
          {
            idType: 'LINKEDIN_FIRST_PARTY_ADS_TRACKING_UUID',
            idValue: 'df5gf5-gh6t7-ph4j7h-fgf6n1'
          }
        ],
        userInfo: {
          firstName: 'mike',
          lastName: 'smith',
          title: 'software engineer',
          companyName: 'microsoft',
          countryCode: 'US'
        }
      }
    }

    nock(
      `${BASE_URL}/campaignConversions/(campaign:urn%3Ali%3AsponsoredCampaign%3A${payload.campaignId[0]},conversion:urn%3Alla%3AllaPartnerConversion%3A${payload.conversionId})`
    )
      .post(/.*/, associateCampignToConversion)
      .reply(204)
    nock(`${BASE_URL}/conversionEvents`).post(/.*/, streamConversionEvent).reply(201)

    await expect(
      testDestination.testAction('streamConversion', {
        event,
        settings,
        mapping: {
          adAccountId: payload.adAccountId,
          user: {
            '@path': '$.context.traits.user'
          },
          campaignId: payload.campaignId,
          conversionHappenedAt: {
            '@path': '$.timestamp'
          },
          onMappingSave: {
            inputs: {},
            outputs: {
              id: payload.conversionId
            }
          }
        }
      })
    ).resolves.not.toThrowError()
  })

  it('should bulk associate campaigns and successfully send the event when multiple campaigns are selected', async () => {
    const multipleCampaigns = payload.campaignId.concat('56789')
    // const associateCampignToConversion = {
    //   campaign: 'urn:li:sponsoredCampaign:123456`',
    //   conversion: 'urn:lla:llaPartnerConversion:789123'
    // }

    const streamConversionEvent = {
      conversion: `urn:lla:llaPartnerConversion:${payload.conversionId}`,
      conversionHappenedAt: Date.now(),
      user: {
        userIds: [
          {
            idType: 'SHA256_EMAIL',
            idValue: 'bad8677b6c86f5d308ee82786c183482a5995f066694246c58c4df37b0cc41f1'
          },
          {
            idType: 'LINKEDIN_FIRST_PARTY_ADS_TRACKING_UUID',
            idValue: 'df5gf5-gh6t7-ph4j7h-fgf6n1'
          }
        ],
        userInfo: {
          firstName: 'mike',
          lastName: 'smith',
          title: 'software engineer',
          companyName: 'microsoft',
          countryCode: 'US'
        }
      }
    }

    nock(`${BASE_URL}`)
      .post(
        '/campaignConversions?ids=List((campaign:urn%3Ali%3AsponsoredCampaign%3A${multipleCampaigns[0]},conversion:urn%3Alla%3AllaPartnerConversion%3A${payload.conversionId}),(campaign:urn%3Ali%3AsponsoredCampaign%3A${multipleCampaigns[1]},conversion:urn%3Alla%3AllaPartnerConversion%3A${payload.conversionId}))'
      )
      .reply(200)
    nock(`${BASE_URL}/conversionEvents`).post(/.*/, streamConversionEvent).reply(201)

    const responses = await testDestination.testAction('streamConversion', {
      event,
      settings,
      mapping: {
        adAccountId: payload.adAccountId,
        user: {
          '@path': '$.context.traits.user'
        },
        campaignId: multipleCampaigns,
        conversionHappenedAt: {
          '@path': '$.timestamp'
        },
        onMappingSave: {
          inputs: {},
          outputs: {
            id: payload.conversionId
          }
        }
      }
    })

    console.log('responses', responses)
  })

  it('should throw an error if timestamp is not within the past 90 days', async () => {
    event.timestamp = '50000000000'

    await expect(
      testDestination.testAction('streamConversion', {
        event,
        settings,
        mapping: {
          adAccountId: payload.adAccountId,
          user: {
            '@path': '$.context.traits.user'
          },
          campaignId: payload.campaignId,
          conversionHappenedAt: {
            '@path': '$.timestamp'
          }
        }
      })
    ).rejects.toThrowError('Timestamp should be within the past 90 days.')
  })

  it('should throw an error if Either userIds array or userInfo with firstName and lastName is not present.', async () => {
    const event = createTestEvent({
      event: 'Example Event',
      type: 'track',
      timestamp: `${Date.now()}`,
      context: {
        traits: {
          email: 'testing@testing.com',
          userIds: [],
          userInfo: {
            title: 'software engineer',
            companyName: 'microsoft',
            countryCode: 'US'
          }
        }
      }
    })

    await expect(
      testDestination.testAction('streamConversion', {
        event,
        settings,
        mapping: {
          adAccountId: payload.adAccountId,
          userIds: {
            '@path': '$.context.traits.userIds'
          },
          userInfo: {
            '@path': '$.context.traits.userInfo'
          },
          campaignId: payload.campaignId,
          conversionHappenedAt: {
            '@path': '$.timestamp'
          },
          onMappingSave: {
            inputs: {},
            outputs: {
              id: '123'
            }
          }
        }
      })
    ).rejects.toThrowError('Either userIds array or userInfo with firstName and lastName should be present.')
  })
})

describe('LinkedinConversions.dynamicField', () => {
  it('conversionId: should give error if adAccountId is not provided', async () => {
    const settings = {}

    const payload = {
      adAccountId: ''
    }

    const dynamicFn =
      testDestination.actions.streamConversion.definition.hooks?.onMappingSave?.inputFields?.conversionRuleId.dynamic
    const responses = (await testDestination.testDynamicField(
      'streamConversion',
      'conversionId',
      {
        settings,
        payload
      },
      dynamicFn
    )) as DynamicFieldResponse

    expect(responses).toMatchObject({
      choices: [],
      error: {
        message: 'Please select Ad Account first to get list of Conversion Rules.',
        code: 'FIELD_NOT_SELECTED'
      }
    })
  })

  it('campaignId: should give error if adAccountId is not provided', async () => {
    const settings = {}

    const payload = {
      adAccountId: ''
    }
    const responses = (await testDestination.testDynamicField('streamConversion', 'campaignId', {
      settings,
      payload
    })) as DynamicFieldResponse

    expect(responses).toMatchObject({
      choices: [],
      error: {
        message: 'Please select Ad Account first to get list of Conversion Rules.',
        code: 'FIELD_NOT_SELECTED'
      }
    })
  })
})

describe('LinkedinConversions.timestamp', () => {
  it('should convert a human readable date to a unix timestamp', async () => {
    event.timestamp = new Date().toISOString()

    const associateCampignToConversion = {
      campaign: 'urn:li:sponsoredCampaign:123456`',
      conversion: 'urn:lla:llaPartnerConversion:789123'
    }

    const streamConversionEvent = {
      conversion: `urn:lla:llaPartnerConversion:${payload.conversionId}`,
      conversionHappenedAt: 1698840732125,
      user: {
        userIds: [
          {
            idType: 'SHA256_EMAIL',
            idValue: 'bad8677b6c86f5d308ee82786c183482a5995f066694246c58c4df37b0cc41f1'
          },
          {
            idType: 'LINKEDIN_FIRST_PARTY_ADS_TRACKING_UUID',
            idValue: 'df5gf5-gh6t7-ph4j7h-fgf6n1'
          }
        ],
        userInfo: {
          firstName: 'mike',
          lastName: 'smith',
          title: 'software engineer',
          companyName: 'microsoft',
          countryCode: 'US'
        }
      }
    }

    nock(
      `${BASE_URL}/campaignConversions/(campaign:urn%3Ali%3AsponsoredCampaign%3A${payload.campaignId},conversion:urn%3Alla%3AllaPartnerConversion%3A${payload.conversionId})`
    )
      .post(/.*/, associateCampignToConversion)
      .reply(204)
    nock(`${BASE_URL}/conversionEvents`).post(/.*/, streamConversionEvent).reply(201)

    await expect(
      testDestination.testAction('streamConversion', {
        event,
        settings,
        mapping: {
          adAccountId: payload.adAccountId,
          user: {
            '@path': '$.context.traits.user'
          },
          campaignId: payload.campaignId,
          conversionHappenedAt: {
            '@path': '$.timestamp'
          },
          onMappingSave: {
            inputs: {},
            outputs: {
              id: payload.conversionId
            }
          }
        }
      })
    ).resolves.not.toThrowError()
  })

  it('should convert a string unix timestamp to a number', async () => {
    event.timestamp = Date.now().toString()

    const associateCampignToConversion = {
      campaign: 'urn:li:sponsoredCampaign:123456`',
      conversion: 'urn:lla:llaPartnerConversion:789123'
    }

    const streamConversionEvent = {
      conversion: `urn:lla:llaPartnerConversion:${payload.conversionId}`,
      conversionHappenedAt: 1698840732125,
      user: {
        userIds: [
          {
            idType: 'SHA256_EMAIL',
            idValue: 'bad8677b6c86f5d308ee82786c183482a5995f066694246c58c4df37b0cc41f1'
          },
          {
            idType: 'LINKEDIN_FIRST_PARTY_ADS_TRACKING_UUID',
            idValue: 'df5gf5-gh6t7-ph4j7h-fgf6n1'
          }
        ],
        userInfo: {
          firstName: 'mike',
          lastName: 'smith',
          title: 'software engineer',
          companyName: 'microsoft',
          countryCode: 'US'
        }
      }
    }

    nock(
      `${BASE_URL}/campaignConversions/(campaign:urn%3Ali%3AsponsoredCampaign%3A${payload.campaignId},conversion:urn%3Alla%3AllaPartnerConversion%3A${payload.conversionId})`
    )
      .post(/.*/, associateCampignToConversion)
      .reply(204)
    nock(`${BASE_URL}/conversionEvents`).post(/.*/, streamConversionEvent).reply(201)

    await expect(
      testDestination.testAction('streamConversion', {
        event,
        settings,
        mapping: {
          adAccountId: payload.adAccountId,
          user: {
            '@path': '$.context.traits.user'
          },
          campaignId: payload.campaignId,
          conversionHappenedAt: {
            '@path': '$.timestamp'
          },
          onMappingSave: {
            inputs: {},
            outputs: {
              id: payload.conversionId
            }
          }
        }
      })
    ).resolves.not.toThrowError()
  })
})
