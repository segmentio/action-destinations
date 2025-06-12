import {
    Region,
    ConversionTypeV2,
    CurrencyCodeV1,
    MatchKeyTypeV1
} from '../types'

describe('Amazon Conversions API Types', () => {
    describe('Region enum', () => {
        it('should have the correct API endpoints defined', () => {
            expect(Region.NA).toBe('https://advertising-api.amazon.com')
            expect(Region.EU).toBe('https://advertising-api-eu.amazon.com')
            expect(Region.FE).toBe('https://advertising-api-fe.amazon.com')
        })
    })

    describe('ConversionTypeV2 enum', () => {
        it('should have all expected event types defined', () => {
            expect(ConversionTypeV2.ADD_TO_SHOPPING_CART).toBe('ADD_TO_SHOPPING_CART')
            expect(ConversionTypeV2.APPLICATION).toBe('APPLICATION')
            expect(ConversionTypeV2.CHECKOUT).toBe('CHECKOUT')
            expect(ConversionTypeV2.CONTACT).toBe('CONTACT')
            expect(ConversionTypeV2.LEAD).toBe('LEAD')
            expect(ConversionTypeV2.OFF_AMAZON_PURCHASES).toBe('OFF_AMAZON_PURCHASES')
            expect(ConversionTypeV2.MOBILE_APP_FIRST_START).toBe('MOBILE_APP_FIRST_START')
            expect(ConversionTypeV2.PAGE_VIEW).toBe('PAGE_VIEW')
            expect(ConversionTypeV2.SEARCH).toBe('SEARCH')
            expect(ConversionTypeV2.SIGN_UP).toBe('SIGN_UP')
            expect(ConversionTypeV2.SUBSCRIBE).toBe('SUBSCRIBE')
            expect(ConversionTypeV2.OTHER).toBe('OTHER')
        })
    })

    describe('CurrencyCodeV1 enum', () => {
        it('should have common currency codes defined', () => {
            expect(CurrencyCodeV1.USD).toBe('USD')
            expect(CurrencyCodeV1.EUR).toBe('EUR')
            expect(CurrencyCodeV1.GBP).toBe('GBP')
            expect(CurrencyCodeV1.JPY).toBe('JPY')
            expect(CurrencyCodeV1.CAD).toBe('CAD')
            expect(CurrencyCodeV1.AUD).toBe('AUD')
        })
    })

    describe('MatchKeyTypeV1 enum', () => {
        it('should have all match key types defined', () => {
            expect(MatchKeyTypeV1.EMAIL).toBe('EMAIL')
            expect(MatchKeyTypeV1.PHONE).toBe('PHONE')
            expect(MatchKeyTypeV1.FIRST_NAME).toBe('FIRST_NAME')
            expect(MatchKeyTypeV1.LAST_NAME).toBe('LAST_NAME')
            expect(MatchKeyTypeV1.ADDRESS).toBe('ADDRESS')
            expect(MatchKeyTypeV1.CITY).toBe('CITY')
            expect(MatchKeyTypeV1.STATE).toBe('STATE')
            expect(MatchKeyTypeV1.POSTAL).toBe('POSTAL')
            expect(MatchKeyTypeV1.MAID).toBe('MAID')
            expect(MatchKeyTypeV1.RAMP_ID).toBe('RAMP_ID')
            expect(MatchKeyTypeV1.MATCH_ID).toBe('MATCH_ID')
        })
    })
})
