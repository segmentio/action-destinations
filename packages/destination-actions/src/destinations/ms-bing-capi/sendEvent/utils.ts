import { CURRENCY_ISO_CODES } from './constants'

export function getCurrencyChoices() {
    return Array.from(CURRENCY_ISO_CODES).map(code => ({ label: code, value: code }))
}