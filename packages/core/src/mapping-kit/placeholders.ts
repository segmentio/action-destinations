import { get } from '../get'
import { realTypeOf } from '../real-type-of'

const entityMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
}

function escapeHtml(value: unknown): string | unknown {
  if (typeof value !== 'string') return value

  return value.replace(/[&<>"'`=/]/g, (match) => {
    return entityMap[match]
  })
}

/**
 * Replaces curly brace placeholders in a template with real content
 */
export function render(template: string, data: unknown = {}): string {
  if (typeof template !== 'string') {
    throw new TypeError(`Invalid template! Template should be a "string" but ${realTypeOf(template)} was given.`)
  }

  function replacer(chars: number, escape: boolean) {
    return (match: string): string => {
      // Remove the wrapping curly braces
      match = match.slice(chars, -chars).trim()

      // Grab the value from data, if it exists
      const value = get(data, match)

      // Replace with the value (or empty string)
      if (escape) {
        return String(escapeHtml(value) ?? '')
      }

      return (value ?? '') as string
    }
  }

  return (
    template
      // Replace unescaped content
      .replace(/\{\{\{([^}]+)\}\}\}/g, replacer(3, false))
      // Replace escaped content
      .replace(/\{\{([^}]+)\}\}/g, replacer(2, true))
  )
}
