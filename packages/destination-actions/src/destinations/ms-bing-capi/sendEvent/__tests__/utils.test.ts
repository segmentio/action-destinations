import { getCurrencyChoices } from '../utils'
import { CURRENCY_ISO_CODES } from '../constants'

describe('MS Bing CAPI utils', () => {
  describe('getCurrencyChoices', () => {
    it('should convert currency ISO codes to choice objects', () => {
      const choices = getCurrencyChoices()

      // Verify the returned array contains objects with label and value properties
      expect(choices.length).toBeGreaterThan(0)
      expect(choices.length).toEqual(CURRENCY_ISO_CODES.size)

      // Check a few examples
      expect(choices).toContainEqual({ label: 'USD', value: 'USD' })
      expect(choices).toContainEqual({ label: 'EUR', value: 'EUR' })
      expect(choices).toContainEqual({ label: 'GBP', value: 'GBP' })

      // Verify each currency code in the Set has a corresponding choice object
      CURRENCY_ISO_CODES.forEach((code) => {
        expect(choices).toContainEqual({ label: code, value: code })
      })

      // Verify all choices follow the pattern
      choices.forEach((choice) => {
        expect(choice).toHaveProperty('label')
        expect(choice).toHaveProperty('value')
        expect(choice.label).toEqual(choice.value)
        expect(CURRENCY_ISO_CODES.has(choice.value)).toBe(true)
      })
    })
  })
})
