import { isIPv4, isIPv6 } from 'net'
import { URL } from 'url'

const RESTRICTED_CIDRS_V4: Array<[number, number, string]> = [
  [0x00000000, 0xff000000, '0.0.0.0/8'],
  [0x0a000000, 0xff000000, '10.0.0.0/8'],
  [0x64400000, 0xffc00000, '100.64.0.0/10'],
  [0x7f000000, 0xff000000, '127.0.0.0/8'],
  [0xa9fe0000, 0xffff0000, '169.254.0.0/16'], // AWS IMDS + link-local
  [0xac100000, 0xfff00000, '172.16.0.0/12'],
  [0xc0000000, 0xffffff00, '192.0.0.0/24'],
  [0xc0000200, 0xffffff00, '192.0.2.0/24'],
  [0xc0a80000, 0xffff0000, '192.168.0.0/16'],
  [0xc6336400, 0xffffff00, '198.51.100.0/24'],
  [0xcb007100, 0xffffff00, '203.0.113.0/24'],
  [0xe0000000, 0xf0000000, '224.0.0.0/4'], // multicast
  [0xf0000000, 0xf0000000, '240.0.0.0/4'] // reserved
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
  // Block loopback (::1), unspecified (::), and link-local (fe80::/10)
  const lower = ip.toLowerCase()
  if (lower === '::1' || lower === '::') return true
  if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) {
    return true // fe80::/10
  }
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true // fc00::/7 unique local
  return false
}

function normalizeHostname(hostname: string): { ip: string | null; blocked: boolean } {
  // Integer IP (e.g. 2852039166 → 169.254.169.254)
  const asInt = parseInt(hostname, 10)
  if (asInt.toString() === hostname) {
    const ip = intToIpv4(asInt)
    return { ip, blocked: false }
  }

  // Block hex (0xa9fea9fe), octal (0251.0376...), and other ambiguous numeric forms
  // that some HTTP clients accept but net.isIPv4 rejects
  if (/^[\d.x]+$/i.test(hostname) && !isIPv4(hostname)) {
    return { ip: null, blocked: true }
  }

  return { ip: hostname, blocked: false }
}

/**
 * Returns true if the URL should be blocked due to SSRF risk.
 * Blocks private/loopback/link-local IPs, non-http(s) schemes,
 * and obfuscated IP representations (hex, octal, integer).
 */
export function isRestrictedUrl(rawUrl: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return true // unparseable URLs are blocked
  }

  // Only allow http and https
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return true

  const hostname = parsed.hostname.replace(/^\[/, '').replace(/\]$/, '') // strip IPv6 brackets

  const { ip, blocked } = normalizeHostname(hostname)
  if (blocked) return true
  if (ip === null) return true

  if (isIPv4(ip)) return isRestrictedIPv4(ip)
  if (isIPv6(ip)) return isRestrictedIPv6(ip)

  // Hostname (not a bare IP) — allow it; DNS-level protection is the backstop
  return false
}
