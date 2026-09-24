import {
  SCHEME_PREFIX,
  companyKey,
  normalizeCompanyPageUrl,
  normalizeCountry,
  normalizeDomain,
  normalizeIdentifiers,
  normalizeIndustries,
  normalizeTraits
} from '../functions'
import { COUNTRY_CODES, MAX_COMPANY_PAGE_URL_LENGTH } from '../constants'
import type { Payload } from '../generated-types'
import type { NormalizedIdentifiers, NormalizedTraits, ValidCompanyPayload } from '../types'

const payload = (overrides: Partial<Payload> = {}): Payload =>
  ({
    identifiers: {},
    dmp_company_action: 'ADD',
    audience_source: 'ENGAGE_RETL',
    ...overrides
  } as Payload)

// A validated payload carrying only what companyKey reads. `index` is the payload's position in
// the original batch; companyKey ignores it, but the type requires it, so it is fixed at 0 here.
const keyed = (
  identifiers: NormalizedIdentifiers,
  action = 'ADD',
  company_traits?: NormalizedTraits
): ValidCompanyPayload => ({
  dmp_company_action: action,
  audience_source: 'ENGAGE_RETL',
  identifiers,
  company_traits,
  index: 0
})

describe('SCHEME_PREFIX', () => {
  const strip = (value: string) => value.replace(SCHEME_PREFIX, '')

  describe('matches a leading scheme', () => {
    it.each([
      // web
      'http://microsoft.com',
      'https://microsoft.com',
      'ws://microsoft.com',
      'wss://microsoft.com',
      // file transfer and storage
      'ftp://microsoft.com',
      'ftps://microsoft.com',
      'sftp://microsoft.com',
      'file://microsoft.com',
      's3://microsoft.com',
      'gs://microsoft.com',
      'smb://microsoft.com',
      'nfs://microsoft.com',
      // source control and remote access
      'git://microsoft.com',
      'ssh://microsoft.com',
      'svn://microsoft.com',
      'rsync://microsoft.com',
      'telnet://microsoft.com',
      // directory, mail and messaging
      'ldap://microsoft.com',
      'ldaps://microsoft.com',
      'imap://microsoft.com',
      'nntp://microsoft.com',
      'irc://microsoft.com',
      'webcal://microsoft.com',
      // databases and brokers
      'redis://microsoft.com',
      'mongodb://microsoft.com',
      'postgres://microsoft.com',
      'mysql://microsoft.com',
      'amqp://microsoft.com',
      'mqtt://microsoft.com',
      // app and platform schemes, including hyphenated ones
      'chrome-extension://microsoft.com',
      'moz-extension://microsoft.com',
      'android-app://microsoft.com',
      'content://microsoft.com',
      'market://microsoft.com'
    ])('%s', (value: string) => {
      expect(strip(value)).toBe('microsoft.com')
    })
  })

  // Only the scheme is removed. Everything after it survives untouched, including the parts that
  // later stages go on to strip, so a failure here points at the regex rather than at a caller.
  describe('strips the scheme and leaves the rest of the url alone', () => {
    it.each([
      ['a bare host', 'https://microsoft.com', 'microsoft.com'],
      ['a trailing slash', 'https://microsoft.com/', 'microsoft.com/'],
      ['a path', 'https://microsoft.com/about', 'microsoft.com/about'],
      ['a deep path', 'https://microsoft.com/a/b/c', 'microsoft.com/a/b/c'],
      ['a query string', 'https://microsoft.com?a=1', 'microsoft.com?a=1'],
      ['a fragment', 'https://microsoft.com#top', 'microsoft.com#top'],
      ['a port', 'https://microsoft.com:8080', 'microsoft.com:8080'],
      ['a user', 'https://joe@microsoft.com', 'joe@microsoft.com'],
      ['credentials', 'https://joe:pw@microsoft.com', 'joe:pw@microsoft.com'],
      ['a subdomain', 'https://www.microsoft.com', 'www.microsoft.com'],
      ['casing, which it does not change', 'https://MICROSOFT.COM', 'MICROSOFT.COM'],
      ['an ip address', 'https://192.168.0.1', '192.168.0.1'],
      ['an ipv6 host', 'https://[::1]:8080', '[::1]:8080'],
      ['localhost and a port', 'http://localhost:3000', 'localhost:3000'],
      ['everything at once', 'https://joe@microsoft.com:8080/a/b?c=1#top', 'joe@microsoft.com:8080/a/b?c=1#top']
    ])('keeps %s', (_label: string, input: string, expected: string) => {
      expect(strip(input)).toBe(expected)
    })
  })

  describe('is case-insensitive, so the constant does not depend on the caller lower-casing', () => {
    it.each(['HTTPS://microsoft.com', 'Https://microsoft.com', 'HtTpS://microsoft.com', 'HTTP://microsoft.com'])(
      '%s',
      (value: string) => {
        expect(strip(value)).toBe('microsoft.com')
      }
    )
  })

  describe('accepts the full RFC 3986 scheme grammar', () => {
    it.each([
      ['digits', 'h2://microsoft.com'],
      ['a plus', 'svn+ssh://microsoft.com'],
      ['a dot', 'a.b://microsoft.com'],
      ['a hyphen', 'view-source://microsoft.com'],
      ['all of them', 'a1+b-c.d://microsoft.com']
    ])('allows %s in a scheme', (_label: string, value: string) => {
      expect(strip(value)).toBe('microsoft.com')
    })
  })

  describe('does not match', () => {
    it.each([
      ['a bare domain', 'microsoft.com'],
      ['a bare subdomain', 'www.microsoft.com'],
      ['a domain with a path', 'linkedin.com/company/microsoft'],
      ['a domain with a query string', 'microsoft.com?a=1'],
      // These look like a scheme right up to the colon, and are only rejected because what
      // follows is not '//'.
      ['a host and port', 'microsoft.com:8080'],
      ['a host, port and path', 'microsoft.com:8080/about'],
      ['a scheme with no slashes', 'mailto:joe@microsoft.com'],
      ['a single slash', 'https:/microsoft.com'],
      ['a bare colon', 'microsoft.com:'],
      ['a protocol-relative url', '//microsoft.com'],
      ['a scheme starting with a digit', '1https://microsoft.com'],
      ['a scheme starting with a symbol', '-https://microsoft.com'],
      ['a scheme with an underscore, which is not in the grammar', 'my_scheme://microsoft.com'],
      ['an empty string', ''],
      ['only whitespace', '   '],
      ['leading whitespace before a scheme', ' https://microsoft.com'],
      ['a scheme that is not at the start', 'go to https://microsoft.com']
    ])('%s', (_label: string, value: string) => {
      expect(strip(value)).toBe(value)
    })
  })

  it('strips only the leading scheme, leaving a later one untouched', () => {
    expect(strip('https://example.com/r?url=https://microsoft.com')).toBe('example.com/r?url=https://microsoft.com')
  })

  it('is not a global regex, so repeated tests do not drift with lastIndex', () => {
    expect(SCHEME_PREFIX.global).toBe(false)
    expect(SCHEME_PREFIX.test('https://microsoft.com')).toBe(true)
    expect(SCHEME_PREFIX.test('https://microsoft.com')).toBe(true)
    expect(SCHEME_PREFIX.test('https://microsoft.com')).toBe(true)
  })
})

describe('normalizeDomain', () => {
  describe('plain domains', () => {
    it.each([
      ['a plain domain', 'microsoft.com', 'microsoft.com'],
      ['upper case', 'MICROSOFT.COM', 'microsoft.com'],
      ['mixed case', 'Microsoft.Com', 'microsoft.com'],
      ['surrounding whitespace', '  microsoft.com  ', 'microsoft.com'],
      ['tabs and newlines', '\t microsoft.com \n', 'microsoft.com'],
      ['a subdomain', 'mail.microsoft.com', 'mail.microsoft.com'],
      ['several subdomains', 'a.b.c.microsoft.com', 'a.b.c.microsoft.com'],
      ['a multi-part tld', 'microsoft.co.uk', 'microsoft.co.uk'],
      ['a hyphenated domain', 'my-company.com', 'my-company.com'],
      ['a numeric domain', '123.com', '123.com'],
      ['a long tld', 'microsoft.technology', 'microsoft.technology'],
      ['a non-ascii domain, converted to punycode', 'müller.de', 'xn--mller-kva.de']
    ])('handles %s', (_label: string, input: string, expected: string) => {
      expect(normalizeDomain(input)).toBe(expected)
    })
  })

  describe('schemes', () => {
    it.each([
      ['http', 'http://microsoft.com', 'microsoft.com'],
      ['https', 'https://microsoft.com', 'microsoft.com'],
      ['an upper case scheme', 'HTTPS://Microsoft.com', 'microsoft.com'],
      ['a mixed case scheme', 'HtTpS://microsoft.com', 'microsoft.com'],
      ['ftp', 'ftp://files.microsoft.com', 'files.microsoft.com'],
      ['a scheme and www', 'https://www.microsoft.com', 'www.microsoft.com'],
      ['mailto, which has no slashes', 'mailto:joe@microsoft.com', 'microsoft.com'],
      ['a protocol-relative url', '//microsoft.com', 'microsoft.com'],
      ['a protocol-relative url with a path', '//microsoft.com/about', 'microsoft.com']
    ])('strips %s', (_label: string, input: string, expected: string) => {
      expect(normalizeDomain(input)).toBe(expected)
    })
  })

  describe('email addresses', () => {
    it.each([
      ['a full email address', 'joe.bloggs@microsoft.com', 'microsoft.com'],
      ['an email with a plus tag', 'joe+segment@microsoft.com', 'microsoft.com'],
      ['an email with digits', 'joe123@microsoft.com', 'microsoft.com'],
      ['an upper case email', 'JOE@MICROSOFT.COM', 'microsoft.com'],
      ['a leading @', '@microsoft.com', 'microsoft.com'],
      ['whitespace around a full email', '  Joe@Microsoft.com  ', 'microsoft.com'],
      ['credentials in a url', 'user:pass@microsoft.com', 'microsoft.com'],
      ['an email at a subdomain', 'joe@mail.microsoft.co.uk', 'mail.microsoft.co.uk']
    ])('takes the domain from %s', (_label: string, input: string, expected: string) => {
      expect(normalizeDomain(input)).toBe(expected)
    })

    it('takes the part after the last @ when there are several', () => {
      expect(normalizeDomain('weird@name@microsoft.com')).toBe('microsoft.com')
    })
  })

  describe('trailing components', () => {
    it.each([
      ['a path', 'microsoft.com/about', 'microsoft.com'],
      ['a deep path', 'microsoft.com/a/b/c', 'microsoft.com'],
      ['a query string', 'microsoft.com?a=1', 'microsoft.com'],
      ['a fragment', 'microsoft.com#top', 'microsoft.com'],
      ['a trailing slash', 'microsoft.com/', 'microsoft.com'],
      ['a port', 'microsoft.com:8080', 'microsoft.com'],
      ['a port and a path', 'microsoft.com:8080/about', 'microsoft.com']
    ])('drops %s', (_label: string, input: string, expected: string) => {
      expect(normalizeDomain(input)).toBe(expected)
    })
  })

  it('handles everything at once', () => {
    expect(normalizeDomain('  HTTPS://joe@WWW.Microsoft.com:8080/a/b?c=1#top  ')).toBe('www.microsoft.com')
  })

  it.each([
    ['undefined', undefined],
    ['an empty string', ''],
    ['only whitespace', '   '],
    ['only an @', '@'],
    ['an email with no domain', 'joe@'],
    ['a scheme with nothing after it', 'https://'],
    ['only slashes', '//'],
    ['only a path', '/about'],
    ['only a query string', '?a=1'],
    ['only a fragment', '#top'],
    ['only a port', ':8080'],
    ['spaces around the @, which is not a parseable url', 'joe @ microsoft.com']
  ])('returns undefined for %s', (_label: string, input: string | undefined) => {
    expect(normalizeDomain(input)).toBeUndefined()
  })

  // A company email domain is always fully qualified, so anything without a dot is not one.
  describe('requires a dot', () => {
    it('drops a company name mapped into this field by mistake', () => {
      expect(normalizeDomain('Microsoft')).toBeUndefined()
    })

    it.each([
      ['a single label', 'localhost'],
      ['a single label with a port', 'localhost:3000'],
      ['a single label with a path', 'intranet/about']
    ])('drops %s', (_label: string, input: string) => {
      expect(normalizeDomain(input)).toBeUndefined()
    })
  })

  // IP addresses are not company domains. IPv6 is bracketed and so has no dot; IPv4 is all dots,
  // so it is rejected explicitly.
  describe('does not accept an IP address', () => {
    it.each([
      ['an IPv6 loopback literal', '[::1]'],
      ['an IPv6 literal behind a scheme', 'https://[::1]'],
      ['an IPv6 literal after an @', 'joe@[::1]'],
      ['a full IPv6 literal with a port and path', 'https://[2001:db8::1]:8080/about'],
      ['an IPv4-mapped IPv6 literal', '[::ffff:192.168.0.1]'],
      ['an IPv4 address, which the dot check alone would let through', '192.168.0.1'],
      ['a public IPv4 address', '8.8.8.8'],
      ['an IPv4 address behind a scheme', 'https://10.0.0.1/about'],
      ['an IPv4 address with a port', '10.0.0.1:8080'],
      ['an IPv4 address after an @', 'joe@192.168.0.1']
    ])('drops %s', (_label: string, input: string) => {
      expect(normalizeDomain(input)).toBeUndefined()
    })

    it('still accepts a domain whose labels are numeric', () => {
      expect(normalizeDomain('123.com')).toBe('123.com')
    })
  })
})

describe('normalizeCompanyPageUrl', () => {
  it.each([
    ['a plain url', 'linkedin.com/company/microsoft', 'linkedin.com/company/microsoft'],
    ['a scheme', 'https://linkedin.com/company/microsoft', 'linkedin.com/company/microsoft'],
    ['an upper case scheme', 'HTTPS://LinkedIn.com/company/Microsoft', 'linkedin.com/company/microsoft'],
    ['a mixed case scheme', 'HtTpS://linkedin.com/company/microsoft', 'linkedin.com/company/microsoft'],
    ['http', 'http://linkedin.com/company/microsoft', 'linkedin.com/company/microsoft'],
    ['www', 'https://www.linkedin.com/company/microsoft', 'www.linkedin.com/company/microsoft'],
    ['a trailing slash', 'linkedin.com/company/microsoft/', 'linkedin.com/company/microsoft'],
    ['repeated trailing slashes', 'linkedin.com/company/microsoft///', 'linkedin.com/company/microsoft'],
    ['surrounding whitespace', '  linkedin.com/company/microsoft  ', 'linkedin.com/company/microsoft'],
    ['tabs and newlines', '\tlinkedin.com/company/microsoft\n', 'linkedin.com/company/microsoft'],
    ['upper case in the path', 'linkedin.com/company/Microsoft', 'linkedin.com/company/microsoft'],
    ['a deep path', 'linkedin.com/company/microsoft/about', 'linkedin.com/company/microsoft/about'],
    ['a query string', 'linkedin.com/company/microsoft?trk=x', 'linkedin.com/company/microsoft'],
    ['a fragment', 'linkedin.com/company/microsoft#about', 'linkedin.com/company/microsoft'],
    ['a query string and a fragment', 'linkedin.com/company/microsoft?trk=x#about', 'linkedin.com/company/microsoft'],
    [
      'a real tracking parameter copied from a browser',
      'https://www.linkedin.com/company/microsoft?trk=public_profile_topcard-current-company',
      'www.linkedin.com/company/microsoft'
    ],
    [
      'a trailing slash before a query string',
      'linkedin.com/company/microsoft/?viewAsMember=true',
      'linkedin.com/company/microsoft'
    ],
    ['a bare host with no path', 'linkedin.com', 'linkedin.com'],
    ['a protocol-relative url', '//linkedin.com/company/microsoft', 'linkedin.com/company/microsoft'],
    [
      'a protocol-relative url with case and a trailing slash',
      '//WWW.LinkedIn.com/company/Microsoft/',
      'www.linkedin.com/company/microsoft'
    ],
    ['a hyphenated company slug', 'linkedin.com/company/my-company', 'linkedin.com/company/my-company'],
    [
      'scheme, case, whitespace, query and trailing slashes together',
      '  HTTPS://WWW.LinkedIn.com/company/Microsoft//?trk=x#about  ',
      'www.linkedin.com/company/microsoft'
    ]
  ])('handles %s', (_label: string, input: string, expected: string) => {
    expect(normalizeCompanyPageUrl(input)).toBe(expected)
  })

  describe('length limit', () => {
    const prefix = 'linkedin.com/company/'

    it(`keeps a url of exactly ${MAX_COMPANY_PAGE_URL_LENGTH} characters`, () => {
      const url = `${prefix}${'a'.repeat(MAX_COMPANY_PAGE_URL_LENGTH - prefix.length)}`
      expect(url).toHaveLength(MAX_COMPANY_PAGE_URL_LENGTH)
      expect(normalizeCompanyPageUrl(url)).toBe(url)
    })

    it('drops a url one character over the limit rather than truncating it', () => {
      const url = `${prefix}${'a'.repeat(MAX_COMPANY_PAGE_URL_LENGTH + 1 - prefix.length)}`
      expect(url).toHaveLength(MAX_COMPANY_PAGE_URL_LENGTH + 1)
      expect(normalizeCompanyPageUrl(url)).toBeUndefined()
    })

    it('measures length after stripping, so a url only over the limit because of its scheme is kept', () => {
      const bare = `${prefix}${'a'.repeat(MAX_COMPANY_PAGE_URL_LENGTH - prefix.length)}`
      const withScheme = `https://${bare}`
      expect(withScheme.length).toBeGreaterThan(MAX_COMPANY_PAGE_URL_LENGTH)
      expect(normalizeCompanyPageUrl(withScheme)).toBe(bare)
    })

    it('measures length after trimming, so surrounding whitespace does not count', () => {
      const bare = `${prefix}${'a'.repeat(MAX_COMPANY_PAGE_URL_LENGTH - prefix.length)}`
      expect(normalizeCompanyPageUrl(`   ${bare}   `)).toBe(bare)
    })

    // The case that made stripping worth doing: a real company slug, plus the tracking parameter
    // a browser copy adds, goes over the limit. Keeping the query string would drop the whole
    // identifier over noise the customer never knew was in the value.
    it('keeps a url that would only exceed the limit because of its query string', () => {
      const bare = 'www.linkedin.com/company/international-business-machines-corporation'
      const withTracking = `https://${bare}?trk=public_profile_topcard-current-company`

      expect(bare.length).toBeLessThanOrEqual(MAX_COMPANY_PAGE_URL_LENGTH)
      expect(withTracking.length).toBeGreaterThan(MAX_COMPANY_PAGE_URL_LENGTH)
      expect(normalizeCompanyPageUrl(withTracking)).toBe(bare)
    })
  })

  it.each([
    ['undefined', undefined],
    ['an empty string', ''],
    ['only whitespace', '   '],
    ['only slashes', '///'],
    ['a scheme with nothing after it', 'https://']
  ])('returns undefined for %s', (_label: string, input: string | undefined) => {
    expect(normalizeCompanyPageUrl(input)).toBeUndefined()
  })
})

describe('normalizeIndustries', () => {
  describe('input shapes', () => {
    it.each([
      ['a list', ['Software', 'Technology'], ['Software', 'Technology']],
      ['a comma delimited string', 'Software, Technology', ['Software', 'Technology']],
      ['a one-element list holding commas', ['Software, Technology'], ['Software', 'Technology']],
      ['a mix of both', ['Software, Technology', 'Finance'], ['Software', 'Technology', 'Finance']],
      ['a single value as a string', 'Software', ['Software']],
      ['a single value as a list', ['Software'], ['Software']],
      ['commas with no spacing', 'software,technology', ['software', 'technology']],
      ['commas with wide spacing', 'software   ,   technology', ['software', 'technology']],
      ['trailing and repeated commas', 'software,,technology,', ['software', 'technology']],
      ['a leading comma', ',software', ['software']]
    ])('handles %s', (_label: string, input: string | string[], expected: string[]) => {
      expect(normalizeIndustries(input)).toEqual(expected)
    })
  })

  describe('cleaning', () => {
    it('trims each entry and keeps the spelling it was given', () => {
      expect(normalizeIndustries(['  Information Technology  ', 'SOFTWARE'])).toEqual([
        'Information Technology',
        'SOFTWARE'
      ])
    })

    it('de-duplicates ignoring case, keeping the first spelling seen', () => {
      expect(normalizeIndustries(['Software', 'software', '  SOFTWARE  '])).toEqual(['Software'])
    })

    it('de-duplicates across the list and the split parts', () => {
      expect(normalizeIndustries(['Software, software', 'SOFTWARE'])).toEqual(['Software'])
    })

    it('preserves the order in which entries first appear', () => {
      expect(normalizeIndustries('zebra, apple, mango')).toEqual(['zebra', 'apple', 'mango'])
    })

    it('accepts free text that is not a LinkedIn taxonomy label', () => {
      // The DMP field is free-text matching input, not an enum over LinkedIn's industry taxonomy,
      // so we deliberately do not validate against it.
      expect(normalizeIndustries('tech')).toEqual(['tech'])
    })
  })

  describe('limits', () => {
    it('caps the list at three entries', () => {
      expect(normalizeIndustries(['one', 'two', 'three', 'four', 'five'])).toEqual(['one', 'two', 'three'])
    })

    it('caps at three after splitting a comma delimited string', () => {
      expect(normalizeIndustries('one,two,three,four,five')).toEqual(['one', 'two', 'three'])
    })

    it('counts toward the cap only after de-duplication', () => {
      expect(normalizeIndustries('a,a,b,c,d')).toEqual(['a', 'b', 'c'])
    })

    it('keeps an entry of exactly 50 characters', () => {
      const industry = 'a'.repeat(50)
      expect(normalizeIndustries([industry])).toEqual([industry])
    })

    it('drops an entry of 51 characters but keeps the others', () => {
      expect(normalizeIndustries(['a'.repeat(51), 'software'])).toEqual(['software'])
    })

    it('drops an over-long split part but keeps the rest', () => {
      expect(normalizeIndustries(`${'a'.repeat(51)},software`)).toEqual(['software'])
    })
  })

  it.each([
    ['undefined', undefined],
    ['an empty list', []],
    ['an empty string', ''],
    ['only blanks', '  ,  ,  '],
    ['a list of blanks', ['', '   ']],
    ['only commas', ',,,'],
    ['a single over-long entry', 'a'.repeat(51)]
  ])('returns undefined for %s', (_label: string, input: string | string[] | undefined) => {
    expect(normalizeIndustries(input)).toBeUndefined()
  })
})

describe('normalizeCountry', () => {
  describe('accepts an ISO 3166-1 alpha-2 code', () => {
    it.each([
      ['upper case', 'US', 'US'],
      ['lower case', 'us', 'US'],
      ['mixed case', 'Us', 'US'],
      ['surrounding whitespace', '  de  ', 'DE'],
      ['GB, the real code for the United Kingdom', 'GB', 'GB'],
      ['Palestine', 'PS', 'PS'],
      ['Taiwan', 'TW', 'TW'],
      ['Côte d’Ivoire', 'CI', 'CI'],
      ['a territory', 'AX', 'AX']
    ])('%s', (_label: string, input: string, expected: string) => {
      expect(normalizeCountry(input)).toBe(expected)
    })
  })

  describe('rejects a value that is not an ISO code', () => {
    it.each([
      ['UK, which is well formed but reserved rather than assigned', 'UK'],
      ['UN, which is reserved for the United Nations', 'UN'],
      ['a country name', 'United States'],
      ['a three-letter code', 'USA'],
      ['a one-letter code', 'U'],
      ['a numeric code', '840'],
      ['a made-up code', 'ZZ'],
      ['a code with punctuation', 'U.S'],
      ['undefined', undefined],
      ['an empty string', ''],
      ['only whitespace', '   ']
    ])('%s', (_label: string, input: string | undefined) => {
      expect(normalizeCountry(input)).toBeUndefined()
    })
  })

  it('accepts every code in the list it validates against, in either case', () => {
    for (const code of COUNTRY_CODES) {
      expect(normalizeCountry(code)).toBe(code)
      expect(normalizeCountry(code.toLowerCase())).toBe(code)
    }
  })

  it('validates against a list that covers all 249 officially assigned codes and nothing else', () => {
    // Pinned in full so an edit cannot quietly drop a country, or admit a reserved code such as
    // 'UN', without failing here.
    const officiallyAssigned = `
      AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ
      BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ
      CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ
      DE DJ DK DM DO DZ
      EC EE EG EH ER ES ET
      FI FJ FK FM FO FR
      GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY
      HK HM HN HR HT HU
      ID IE IL IM IN IO IQ IR IS IT
      JE JM JO JP
      KE KG KH KI KM KN KP KR KW KY KZ
      LA LB LC LI LK LR LS LT LU LV LY
      MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ
      NA NC NE NF NG NI NL NO NP NR NU NZ
      OM
      PA PE PF PG PH PK PL PM PN PR PS PT PW PY
      QA
      RE RO RS RU RW
      SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ
      TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ
      UA UG UM US UY UZ
      VA VC VE VG VI VN VU
      WF WS
      YE YT
      ZA ZM ZW
    `
      .trim()
      .split(/\s+/)

    expect(officiallyAssigned).toHaveLength(249)
    expect([...COUNTRY_CODES].sort()).toEqual([...officiallyAssigned].sort())
  })

  it('holds only upper case two-letter codes', () => {
    for (const code of COUNTRY_CODES) {
      expect(code).toMatch(/^[A-Z]{2}$/)
    }
  })
})

describe('normalizeIdentifiers', () => {
  // Note linkedInCompanyId comes back as the bare id with the urn prefix removed. That is the
  // internal form only: buildJSON and companyKey both put the prefix back, so a customer who maps
  // the full 'urn:li:organization:1035' gets exactly that sent to LinkedIn. See the round trip
  // asserted below.
  it('normalizes all five identifiers', () => {
    expect(
      normalizeIdentifiers(
        payload({
          identifiers: {
            companyName: '  Microsoft Corporation  ',
            companyDomain: '  MICROSOFT.COM  ',
            companyEmailDomain: 'HTTPS://joe@Microsoft.com/about',
            linkedInCompanyId: '  urn:li:organization:1035  ',
            companyPageUrl: 'HTTPS://www.LinkedIn.com/company/Microsoft/'
          }
        })
      )
    ).toEqual({
      companyName: 'Microsoft Corporation',
      companyDomain: 'microsoft.com',
      companyEmailDomain: 'microsoft.com',
      linkedInCompanyId: '1035',
      companyPageUrl: 'www.linkedin.com/company/microsoft'
    })
  })

  it('preserves company name casing while lower-casing the domain', () => {
    expect(
      normalizeIdentifiers(payload({ identifiers: { companyName: "McDonald's", companyDomain: 'McD.com' } }))
    ).toEqual({ companyName: "McDonald's", companyDomain: 'mcd.com' })
  })

  it('strips the urn prefix from a LinkedIn company id', () => {
    expect(normalizeIdentifiers(payload({ identifiers: { linkedInCompanyId: 'urn:li:organization:1035' } }))).toEqual({
      linkedInCompanyId: '1035'
    })
  })

  // Customers map this field from whatever their warehouse holds, which may be a bare id or a
  // full urn. Both spellings have to behave identically all the way through: the same normalized
  // value, the same dedup key, and the same urn sent to LinkedIn.
  describe('accepts a bare id and a full urn interchangeably', () => {
    const spellings = ['1035', 'urn:li:organization:1035', 'URN:LI:ORGANIZATION:1035', '  urn:li:organization:1035  ']

    it.each(spellings)('normalizes %s to the same bare id', (linkedInCompanyId: string) => {
      expect(normalizeIdentifiers(payload({ identifiers: { linkedInCompanyId } }))).toEqual({
        linkedInCompanyId: '1035'
      })
    })

    it('gives every spelling the same dedup key, so they are not synced as separate companies', () => {
      const keys = spellings.map((linkedInCompanyId) =>
        companyKey(keyed(normalizeIdentifiers(payload({ identifiers: { linkedInCompanyId } }))))
      )

      expect(new Set(keys).size).toBe(1)
    })

    it('sends the full urn whichever spelling was mapped', () => {
      for (const linkedInCompanyId of spellings) {
        const key = companyKey(keyed(normalizeIdentifiers(payload({ identifiers: { linkedInCompanyId } }))))

        expect(JSON.parse(key).organizationUrn).toBe('urn:li:organization:1035')
      }
    })
  })

  it('leaves out identifiers that were not provided', () => {
    expect(normalizeIdentifiers(payload({ identifiers: { companyName: 'Microsoft' } }))).toEqual({
      companyName: 'Microsoft'
    })
  })

  it('returns an empty object when every identifier is blank, which is what validation checks', () => {
    expect(
      normalizeIdentifiers(payload({ identifiers: { companyName: '   ', companyDomain: '', companyPageUrl: '  ' } }))
    ).toEqual({})
  })

  it('drops an identifier that breaches a limit while keeping the others', () => {
    const result = normalizeIdentifiers(
      payload({
        identifiers: { companyName: 'Microsoft', companyPageUrl: `linkedin.com/company/${'a'.repeat(100)}` }
      })
    )
    expect(result).toEqual({ companyName: 'Microsoft' })
  })
})

describe('normalizeTraits', () => {
  const traits = {
    industries: ['Software'],
    city: 'Seattle',
    state: 'WA',
    country: 'us',
    postalCode: '98101',
    stockSymbol: 'msft'
  }

  it('returns undefined when the toggle is off, even if traits are mapped', () => {
    expect(normalizeTraits(payload({ send_company_traits: false, company_traits: traits }))).toBeUndefined()
  })

  it('returns undefined when the toggle is absent', () => {
    expect(normalizeTraits(payload({ company_traits: traits }))).toBeUndefined()
  })

  it('normalizes every trait when the toggle is on', () => {
    expect(normalizeTraits(payload({ send_company_traits: true, company_traits: traits }))).toEqual({
      industries: ['Software'],
      city: 'Seattle',
      state: 'WA',
      country: 'US',
      postalCode: '98101',
      stockSymbol: 'MSFT'
    })
  })

  it('returns undefined when the toggle is on but no trait survives normalization', () => {
    expect(
      normalizeTraits(payload({ send_company_traits: true, company_traits: { city: '   ', country: 'UK' } }))
    ).toBeUndefined()
  })

  it('leaves out a trait that breaches a limit while keeping the others', () => {
    expect(
      normalizeTraits(
        payload({ send_company_traits: true, company_traits: { city: 'a'.repeat(51), state: 'WA', country: 'UK' } })
      )
    ).toEqual({ state: 'WA' })
  })

  it('keeps internal whitespace in a postal code', () => {
    expect(
      normalizeTraits(payload({ send_company_traits: true, company_traits: { postalCode: '  SW1A 1AA  ' } }))
    ).toEqual({ postalCode: 'SW1A 1AA' })
  })
})

describe('companyKey', () => {
  it('names its parts, so it can be read directly when debugging', () => {
    expect(JSON.parse(companyKey(keyed({ companyDomain: 'microsoft.com', linkedInCompanyId: '1035' })))).toEqual({
      action: 'ADD',
      companyDomain: 'microsoft.com',
      organizationUrn: 'urn:li:organization:1035'
    })
  })

  it.each([
    ['name', { companyName: 'Microsoft' }, { companyName: 'Microsoft Corp' }],
    ['domain', { companyDomain: 'a.com' }, { companyDomain: 'b.com' }],
    ['email domain', { companyEmailDomain: 'a.com' }, { companyEmailDomain: 'b.com' }],
    ['company id', { linkedInCompanyId: '1' }, { linkedInCompanyId: '2' }],
    ['page url', { companyPageUrl: 'linkedin.com/company/a' }, { companyPageUrl: 'linkedin.com/company/b' }]
  ])(
    'separates two companies that differ only by %s',
    (_label: string, a: Record<string, string>, b: Record<string, string>) => {
      expect(companyKey(keyed(a))).not.toBe(companyKey(keyed(b)))
    }
  )

  it('gives identical identifiers the same key', () => {
    const identifiers = { companyName: 'Microsoft', companyDomain: 'microsoft.com' }
    expect(companyKey(keyed(identifiers))).toBe(companyKey(keyed({ ...identifiers })))
  })

  it('separates ADD from REMOVE for the same company', () => {
    expect(companyKey(keyed({ companyName: 'Microsoft' }, 'ADD'))).not.toBe(
      companyKey(keyed({ companyName: 'Microsoft' }, 'REMOVE'))
    )
  })

  it('separates a company carrying an extra identifier from one without it', () => {
    expect(companyKey(keyed({ companyDomain: 'microsoft.com' }))).not.toBe(
      companyKey(keyed({ companyDomain: 'microsoft.com', companyName: 'Microsoft' }))
    )
  })

  it('does not collide when a value contains the characters a delimiter would use', () => {
    // A delimited key could not tell these apart: an organization URN is full of colons, and a
    // company name can contain anything.
    expect(companyKey(keyed({ companyName: 'a::b', companyDomain: 'c' }))).not.toBe(
      companyKey(keyed({ companyName: 'a', companyDomain: 'b::c' }))
    )
    expect(companyKey(keyed({ companyName: 'urn:li:organization:1035' }))).not.toBe(
      companyKey(keyed({ linkedInCompanyId: '1035' }))
    )
  })

  it('ignores traits, so the same company collapses whatever its traits say', () => {
    const seattle = keyed({ companyName: 'Microsoft' }, 'ADD', { city: 'Seattle' })
    const austin = keyed({ companyName: 'Microsoft' }, 'ADD', { city: 'Austin' })
    expect(companyKey(seattle)).toBe(companyKey(austin))
  })
})
