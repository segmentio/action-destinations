import { fields } from '../fields'

describe('trackConversion fields', () => {
    it('should have all required fields defined', () => {
        // Check that required fields are present
        expect(fields.name).toBeDefined()
        expect(fields.eventType).toBeDefined()
        expect(fields.eventActionSource).toBeDefined()
        expect(fields.countryCode).toBeDefined()
        expect(fields.timestamp).toBeDefined()
        expect(fields.matchKeys).toBeDefined()
        expect(fields.enable_batching).toBeDefined()
    })

    it('should mark required fields as required', () => {
        expect(fields.name.required).toBe(true)
        expect(fields.eventType.required).toBe(true)
        expect(fields.eventActionSource.required).toBe(true)
        expect(fields.countryCode.required).toBe(true)
        expect(fields.timestamp.required).toBe(true)
        expect(fields.matchKeys.required).toBe(true)
        expect(fields.enable_batching.required).toBe(true)
    })

    it('should have correct default values', () => {
        expect(fields.name.default).toEqual({ '@path': '$.event' })
        expect(fields.timestamp.default).toEqual({ '@path': '$.timestamp' })
        expect(fields.enable_batching.default).toBe(true)
    })

    it('should have proper types for all fields', () => {
        expect(fields.name.type).toBe('string')
        expect(fields.eventType.type).toBe('string')
        expect(fields.eventActionSource.type).toBe('string')
        expect(fields.countryCode.type).toBe('string')
        expect(fields.timestamp.type).toBe('string')
        expect(fields.matchKeys.type).toBe('object')
        expect(fields.value?.type).toBe('number')
        expect(fields.currencyCode?.type).toBe('string')
        expect(fields.unitsSold?.type).toBe('integer')
        expect(fields.clientDedupeId?.type).toBe('string')
        expect(fields.dataProcessingOptions?.type).toBe('string')
        expect(fields.dataProcessingOptions?.multiple).toBe(true)
        expect(fields.consent?.type).toBe('object')
        expect(fields.customAttributes?.type).toBe('object')
        expect(fields.customAttributes?.multiple).toBe(true)
        expect(fields.enable_batching.type).toBe('boolean')
        expect(fields.batch_size?.type).toBe('number')
    })

    it('should have proper choices for enum fields', () => {
        // Event type choices
        expect(fields.eventType.choices).toHaveLength(12)
        expect(fields.eventType.choices).toContainEqual({ label: 'Add to Shopping Cart', value: 'ADD_TO_SHOPPING_CART' })
        expect(fields.eventType.choices).toContainEqual({ label: 'Page View', value: 'PAGE_VIEW' })
        expect(fields.eventType.choices).toContainEqual({ label: 'Other', value: 'OTHER' })

        // Event action source choices
        expect(fields.eventActionSource.choices).toHaveLength(5)
        expect(fields.eventActionSource.choices).toContainEqual({ label: 'Website', value: 'website' })
        expect(fields.eventActionSource.choices).toContainEqual({ label: 'Android', value: 'android' })

        // Currency code choices
        expect(fields.currencyCode?.choices).toBeDefined()
        expect(fields.currencyCode?.choices?.length).toBeGreaterThan(0)
        expect(fields.currencyCode?.choices).toContainEqual({ label: 'USD - US Dollar', value: 'USD' })

        // Data processing options choices
        expect(fields.dataProcessingOptions?.choices).toHaveLength(1)
        const choice = fields.dataProcessingOptions?.choices?.[0]
        expect(typeof choice === 'object' ? choice.value : choice).toBe('LIMITED_DATA_USE')
    })

    it('should conditionally require currencyCode and unitsSold for OFF_AMAZON_PURCHASES', () => {
        expect(fields.currencyCode?.depends_on).toBeDefined()
        expect(fields.currencyCode?.depends_on?.conditions).toBeDefined()
        expect(fields.currencyCode?.depends_on?.conditions?.[0]).toMatchObject({
            operator: 'is',
            value: 'OFF_AMAZON_PURCHASES'
        })

        expect(fields.unitsSold?.depends_on).toBeDefined()
        expect(fields.unitsSold?.depends_on?.conditions).toBeDefined()
        expect(fields.unitsSold?.depends_on?.conditions?.[0]).toMatchObject({
            operator: 'is',
            value: 'OFF_AMAZON_PURCHASES'
        })
    })

    it('should define the matchKeys object with all possible match keys', () => {
        expect(fields.matchKeys.properties).toBeDefined()
        expect(fields.matchKeys.properties?.email).toBeDefined()
        expect(fields.matchKeys.properties?.phone).toBeDefined()
        expect(fields.matchKeys.properties?.firstName).toBeDefined()
        expect(fields.matchKeys.properties?.lastName).toBeDefined()
        expect(fields.matchKeys.properties?.address).toBeDefined()
        expect(fields.matchKeys.properties?.city).toBeDefined()
        expect(fields.matchKeys.properties?.state).toBeDefined()
        expect(fields.matchKeys.properties?.postalCode).toBeDefined()
        expect(fields.matchKeys.properties?.maid).toBeDefined()
        expect(fields.matchKeys.properties?.rampId).toBeDefined()
        expect(fields.matchKeys.properties?.matchId).toBeDefined()
    })

    it('should define consent object with all consent types', () => {
        expect(fields.consent?.properties).toBeDefined()
        expect(fields.consent?.properties?.ipAddress).toBeDefined()
        expect(fields.consent?.properties?.amznAdStorage).toBeDefined()
        expect(fields.consent?.properties?.amznUserData).toBeDefined()
        expect(fields.consent?.properties?.tcf).toBeDefined()
        expect(fields.consent?.properties?.gpp).toBeDefined()
    })

    it('should define customAttributes with proper nested structure', () => {
        expect(fields.customAttributes?.properties).toBeDefined()
        expect(fields.customAttributes?.properties?.name).toBeDefined()
        expect(fields.customAttributes?.properties?.name.required).toBe(true)
        expect(fields.customAttributes?.properties?.value).toBeDefined()
        expect(fields.customAttributes?.properties?.value.required).toBe(true)
    })
})
