import { createPayloadToUploadRecords } from '../../function'
import { AudienceSettings } from '../../generated-types'
import { Payload } from '../../syncAudiencesToDSP/generated-types'

describe('AmazonAds.syncAudiencesToDSP functions', () => {
    it('createPayloadToUploadRecords should reject when audienceSettings are incorrect (DSP)', async () => {
        const payloads = [
            {
                audienceId: 'blah',
            }
        ]

        const audienceSettings1 = {
            syncTo: 'dsp',
            advertiserId: undefined
        }

        expect(() =>
        createPayloadToUploadRecords(payloads as Payload[], audienceSettings1 as AudienceSettings)
        ).toThrow("Advertiser Id value is required when syncing an audience to DSP")
    })

    it('createPayloadToUploadRecords should reject when audienceSettings are incorrect (AMC)', async () => {
        const payloads = [
            {
                audienceId: 'blah',
            }
        ]

        const audienceSettings1 = {
            syncTo: 'amc',
            amcInstanceId: undefined,
            amcAccountId: undefined,
            amcAccountMarketplaceId: undefined
        }

        expect(() =>
        createPayloadToUploadRecords(payloads as Payload[], audienceSettings1 as AudienceSettings)
        ).toThrow("AMC Instance Id, AMC Account Id and AMC Account Marketplace Id value are required when syncing audience to AMC")
    })
})