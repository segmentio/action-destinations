import { isIPv4, isIPv6 } from 'net'
import { URL } from 'url'

// All RFC1918 / link-local / reserved IPv4 CIDRs that must never be reachable
// via a user-supplied webhook URL (OWASP SSRF prevention cheatsheet).
const RESTRICTED_CIDRS_V4: Array<[number, number, string]> = [
  [0x00000000, 0xff000000, '0.0.0.0/8'],
  [0x0a000000, 0xff000000, '10.0.0.0/8'],
  [0x64400000, 0xffc00000, '100.64.0.0/10'],
  [0x7f000000, 0xff000000, '127.0.0.0/8'],
  [0xa9fe0000, 0xffff0000, '169.254.0.0/16'], // link-local / AWS IMDS
  [0xac100000, 0xfff00000, '172.16.0.0/12'],
  [0xc0000000, 0xffffff00, '192.0.0.0/24'],
  [0xc0000200, 0xffffff00, '192.0.2.0/24'],
  [0xc0a80000, 0xffff0000, '192.168.0.0/16'],
  [0xc6336400, 0xffffff00, '198.51.100.0/24'],
  [0xcb007100, 0xffffff00, '203.0.113.0/24'],
  [0xe0000000, 0xf0000000, '224.0.0.0/4'],
  [0xf0000000, 0xf0000000, '240.0.0.0/4']
]

function ipv4ToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) | parseInt(octet, 10), 0) >>> 0
}

function intToIpv4(n: number): string {
  return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff].join('.')
}

function isRestrictedIPv4(ip: string): boolean {
  const int = ipv4ToInt(ip)
  return RESTRICTED_CIDRS_V4.some(([network, mask]) => (int & mask) === network)
}

function isRestrictedIPv6(ip: string): boolean {
  const lower = ip.toLowerCase()
  if (lower === '::1' || lower === '::') return true
  // link-local fe80::/10
  if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb'))
    return true
  // unique local fc00::/7
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true
  return false
}

// Handles decimal/octal/hex integer representations of IPv4 addresses that
// some HTTP clients will resolve. Returns the dotted-decimal form, or signals
// that the hostname is definitely blocked / not an IP.
function normalizeHostname(hostname: string): { ip: string | null; blocked: boolean } {
  // Pure integer → treat as 32-bit IPv4
  const asInt = parseInt(hostname, 10)
  if (asInt.toString() === hostname) {
    const ip = intToIpv4(asInt)
    return { ip, blocked: false }
  }
  // Looks numeric but isn't a valid IPv4 dotted-decimal → block it
  if (/^[\d.x]+$/i.test(hostname) && !isIPv4(hostname)) {
    return { ip: null, blocked: true }
  }
  return { ip: hostname, blocked: false }
}

/**
 * Returns true when the URL must be blocked for SSRF reasons:
 *  - non-http/https scheme
 *  - hostname resolves to a private/reserved IP range
 *  - hostname uses alternative numeric representations of private IPs
 */
export function isRestrictedUrl(rawUrl: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return true
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return true

  // Strip IPv6 brackets that URL keeps in hostname
  const hostname = parsed.hostname.replace(/^\[/, '').replace(/\]$/, '')
  const { ip, blocked } = normalizeHostname(hostname)

  if (blocked) return true
  if (ip === null) return true
  if (isIPv4(ip)) return isRestrictedIPv4(ip)
  if (isIPv6(ip)) return isRestrictedIPv6(ip)

  // Hostname-based URLs: DNS resolution is handled by sandbox/http.js
  return false
}
