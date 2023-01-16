import { get } from '../get'
import { realTypeOf } from '../real-type-of'

/**
 * Replaces curly brace placeholders in a template with real content
 */
export function render(template: string, data: unknown = {}): string {
  if (typeof template !== 'string') {
    throw new TypeError(`Invalid template! Template should be a "string" but ${realTypeOf(template)} was given.`)
  }

  function replacer(chars: number) {
    return (match: string): string => {
      // Remove the wrapping curly braces
      match = match.slice(chars, -chars).trim()

      // Grab the value from data, if it exists
      const value = get(data, match)

      return (value ?? '') as string
    }
  }

  return (
    template
      // Replace unescaped content
      .replace(/\{\{\{([^}]+)\}\}\}/g, replacer(3))
      // Replace escaped content
      .replace(/\{\{([^}]+)\}\}/g, replacer(2))
  )
}
