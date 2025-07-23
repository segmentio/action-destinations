/* eslint-disable */
// @ts-nocheck

import { processHashing } from '../../../lib/hashing-utils'

export function send(tagId): Promise<void> {
  return new Promise((resolve, reject) => {
    ;(function (a, b, c, d) {
      a = `//www.mczbf.com/tags/${tagId}/tag.js`
      b = document
      c = 'script'
      d = b.createElement(c)
      d.src = a
      d.type = 'text/java' + c
      d.async = true
      d.id = 'cjapitag'
      d.onload = () => resolve()
      d.onerror = () => reject(new Error('JC script failed to load correctly'))
      a = b.getElementsByTagName(c)[0]
      a.parentNode.insertBefore(d, a)
    })()
  })
}

export function smartHash(value: string, normalizeFunction?: (value: string) => string): string {
  return processHashing(value, 'sha256', 'hex', normalizeFunction)
}

function normalize(value: string, allowedChars: RegExp, trim = true): string {
  let normalized = value.toLowerCase().replace(allowedChars, '')
  if (trim) normalized = normalized.trim()
  return normalized
}

const emailAllowed = /[^a-z0-9.@+-]/g

export function normalizeEmail(email: string): string {
  return normalize(email, emailAllowed)
}
