import {
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
import type { AudienceAction, NormalizedIdentifiers, NormalizedTraits, ValidCompanyPayload } from '../types'

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
  action: AudienceAction = 'ADD',
  company_traits?: NormalizedTraits
): ValidCompanyPayload => ({
  dmp_company_action: action,
  audience_source: 'ENGAGE_RETL',
  identifiers,
  company_traits,
  index: 0
})

describe('normalizeDomain', () => {
  // The shapes a customer maps into this field, all reduced to the host. Nothing below the host
  // is interpreted: the value is sent as written once the scheme, the path and any email local
  // part are removed.
  describe('reduces each mapped shape to the host', () => {
    it.each([
      ['a bare domain', 'microsoft.com', 'microsoft.com'],
      ['an email address', 'joe.bloggs@microsoft.com', 'microsoft.com'],
      ['a page url', 'https://www.microsoft.com/about?a=1#top', 'www.microsoft.com'],
      ['a company website with a path, which is not refused', 'https://microsoft.com/about', 'microsoft.com'],
      ['a subdomain and a multi-part tld', 'mail.microsoft.co.uk', 'mail.microsoft.co.uk'],
      ['case and whitespace', '  MICROSOFT.COM  ', 'microsoft.com'],
      ['mailto, which has no slashes after the colon', 'mailto:joe@microsoft.com', 'microsoft.com'],
      ['a query string with no path before it', 'https://microsoft.com?utm_source=google', 'microsoft.com'],
      ['a fragment with no path before it', 'microsoft.com#about', 'microsoft.com'],
      ['a port', 'www.microsoft.com:8080', 'www.microsoft.com'],
      ['spaces around the @', 'joe @ microsoft.com', 'microsoft.com'],
      ['all of it at once', '  HTTPS://joe@WWW.Microsoft.com:8080/a/b?c=1#top  ', 'www.microsoft.com']
    ])('takes the host from %s', (_label: string, input: string, expected: string) => {
      expect(normalizeDomain(input)).toBe(expected)
    })

    it('takes the part after the last @ when there are several', () => {
      expect(normalizeDomain('weird@name@microsoft.com')).toBe('microsoft.com')
    })

    // The @ split runs on the host, never on the whole value, so a domain in the query string
    // cannot displace the real one.
    it('ignores an @ that is below the host', () => {
      expect(normalizeDomain('https://microsoft.com?a=b@evil.com')).toBe('microsoft.com')
    })
  })

  // Sent as written, not canonicalised. A customer mapping one company in several spellings gets
  // several companies, which is their business rather than something to guess at here.
  describe('sends the host as written', () => {
    it.each([
      ['an internationalized domain, not converted to punycode', 'müller.de'],
      ['a www prefix', 'www.microsoft.com'],
      ['a trailing dot', 'microsoft.com.'],
      ['an IP address', '192.168.0.1']
    ])('keeps %s', (_label: string, input: string) => {
      expect(normalizeDomain(input)).toBe(input)
    })
  })

  it.each([
    ['undefined', undefined],
    ['an empty string', ''],
    ['only whitespace', '   '],
    ['an email with no domain', 'joe@'],
    ['a scheme with nothing after it', 'https://'],
    ['only a path', '/about'],
    ['a company name that happens to contain a dot', 'Acme Inc.'],
    // The field used to invite a page URL, and a column of them reduces every company to the
    // same host, so the whole batch collapses onto one element that matches nothing.
    ['a linkedin company page url, which is not the company website', 'https://www.linkedin.com/company/microsoft'],
    ['the same without a scheme', 'www.linkedin.com/company/microsoft'],
    ['a linkedin member profile', 'https://www.linkedin.com/in/joe-bloggs'],
    ['a bare linkedin.com, since it is nobody\'s own website domain', 'linkedin.com'],
    ['a bare www.linkedin.com', 'https://www.linkedin.com'],
    ['a company name with a dot mid-string', 'St. Jude Medical'],
    ['a domain with a space inside it', 'micro soft.com']
  ])('returns undefined for %s', (_label: string, input: string | undefined) => {
    expect(normalizeDomain(input)).toBeUndefined()
  })

  // The one rule: a domain has a dot in it.
  describe('requires a dot', () => {
    it.each([
      ['a company name mapped into this field by mistake', 'Microsoft'],
      ['a single label', 'localhost:3000'],
      ['an IPv6 literal, which is bracketed and so has no dot', '[::1]']
    ])('drops %s', (_label: string, input: string) => {
      expect(normalizeDomain(input)).toBeUndefined()
    })

    it('accepts a domain whose labels are numeric', () => {
      expect(normalizeDomain('123.com')).toBe('123.com')
    })
  })
})

describe('normalizeCompanyPageUrl', () => {
  // The field carries no format, so a value with or without a scheme reaches here. Only http(s)
  // is stripped, so any other scheme stays attached and becomes part of the host segment, which
  // then fails the linkedin.com check.
  it.each([
    ['https', 'https://linkedin.com/company/microsoft', 'linkedin.com/company/microsoft'],
    [
      'a percent sign in the slug, sent as written',
      'https://linkedin.com/company/100%-growth',
      'linkedin.com/company/100%-growth'
    ],
    ['no scheme at all', 'linkedin.com/company/microsoft', 'linkedin.com/company/microsoft'],
    [
      "LinkedIn's own documented example, which carries no scheme",
      'www.linkedin.com/company/linkedin',
      'www.linkedin.com/company/linkedin'
    ],
    [
      'a non-ascii slug, sent as written rather than percent-encoded',
      'https://www.linkedin.com/company/société-générale',
      'www.linkedin.com/company/société-générale'
    ],
    ['http', 'http://linkedin.com/company/microsoft', 'linkedin.com/company/microsoft'],
    ['an upper case scheme and host', 'HTTPS://LinkedIn.com/company/Microsoft', 'linkedin.com/company/microsoft'],
    ['www', 'https://www.linkedin.com/company/microsoft', 'www.linkedin.com/company/microsoft'],
    ['a country subdomain', 'https://de.linkedin.com/company/microsoft', 'de.linkedin.com/company/microsoft'],
    [
      'a showcase page',
      'https://www.linkedin.com/showcase/microsoft-azure',
      'www.linkedin.com/showcase/microsoft-azure'
    ],
    ['a hyphenated company slug', 'https://linkedin.com/company/my-company', 'linkedin.com/company/my-company'],
    ['a deep path', 'https://linkedin.com/company/microsoft/about', 'linkedin.com/company/microsoft/about'],
    ['repeated trailing slashes', 'https://linkedin.com/company/microsoft///', 'linkedin.com/company/microsoft'],
    ['a query string', 'https://linkedin.com/company/microsoft?trk=x', 'linkedin.com/company/microsoft'],
    ['a fragment', 'https://linkedin.com/company/microsoft#about', 'linkedin.com/company/microsoft'],
    [
      'a real tracking parameter copied from a browser',
      'https://www.linkedin.com/company/microsoft?trk=public_profile_topcard-current-company',
      'www.linkedin.com/company/microsoft'
    ],
    [
      'a trailing slash before a query string',
      'https://linkedin.com/company/microsoft/?viewAsMember=true',
      'linkedin.com/company/microsoft'
    ],
    [
      'case, path, query and trailing slashes together',
      'HTTPS://WWW.LinkedIn.com/company/Microsoft//?trk=x#about',
      'www.linkedin.com/company/microsoft'
    ]
  ])('handles %s', (_label: string, input: string, expected: string) => {
    expect(normalizeCompanyPageUrl(input)).toBe(expected)
  })

  // The strip used to be an unanchored /\\/+$/, which backtracks quadratically when anything
  // follows the run, on a value whose length is not yet bounded.
  it('strips a long run of trailing slashes without stalling', () => {
    const slug = 'linkedin.com/company/microsoft'
    expect(normalizeCompanyPageUrl(`${slug}${'/'.repeat(50000)}`)).toBe(slug)
  })

  describe('length limit', () => {
    const prefix = 'linkedin.com/company/'
    const bareUrlOfLength = (length: number) => `${prefix}${'a'.repeat(length - prefix.length)}`

    it(`keeps a url of exactly ${MAX_COMPANY_PAGE_URL_LENGTH} characters`, () => {
      const bare = bareUrlOfLength(MAX_COMPANY_PAGE_URL_LENGTH)
      expect(normalizeCompanyPageUrl(`https://${bare}`)).toBe(bare)
    })

    it('drops a url one character over the limit rather than truncating it', () => {
      const bare = bareUrlOfLength(MAX_COMPANY_PAGE_URL_LENGTH + 1)
      expect(normalizeCompanyPageUrl(`https://${bare}`)).toBeUndefined()
    })

    // Same reasoning as the query string below: length is measured on the value actually sent,
    // so a trailing slash the code strips anyway cannot cost the identifier.
    it('keeps a url of exactly the limit that carries a trailing slash', () => {
      const bare = bareUrlOfLength(MAX_COMPANY_PAGE_URL_LENGTH)
      expect(normalizeCompanyPageUrl(`https://${bare}/`)).toBe(bare)
    })

    it('measures length after the scheme is removed, so the scheme cannot push a url over', () => {
      const bare = bareUrlOfLength(MAX_COMPANY_PAGE_URL_LENGTH)
      const withScheme = `https://${bare}`
      expect(withScheme.length).toBeGreaterThan(MAX_COMPANY_PAGE_URL_LENGTH)
      expect(normalizeCompanyPageUrl(withScheme)).toBe(bare)
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
    ['undefined, when the field is not mapped', undefined],
    ['a scheme with nothing after it', 'https://'],
    ['a scheme that parses but has no host or path', 'foo://'],
    ['a company website mapped into this field by mistake', 'https://microsoft.com/about'],
    ['a host that merely ends in the same letters', 'https://notlinkedin.com/company/microsoft'],
    ['a lookalike host that only starts with linkedin.com', 'https://linkedin.com.example.com/company/microsoft'],
    ['a single-label host', 'https://intranet/company/x'],
    ['a mailto, which parses with a linkedin.com host read from its userinfo', 'mailto:joe@linkedin.com/company/x'],
    ['a non-http scheme', 'ftp://linkedin.com/company/x'],
    ['a port, which is not a linkedin.com host', 'linkedin.com:8080/company/microsoft'],
    ['a protocol-relative url, whose host segment is empty', '//linkedin.com/company/microsoft'],
    // A URL parser ends the authority at a backslash, so a string check on the first '/' segment
    // sees 'evil.com\\.linkedin.com' as the host while the value resolves to evil.com.
    ['a backslash before the linkedin.com suffix', 'https://evil.example\\.linkedin.com/company/acme'],
    ['a backslash and a user prefix', 'https://evil.example\\@www.linkedin.com/company/acme'],
    ['an encoded backslash', 'https://evil.example%5C.linkedin.com/company/acme'],
    ['a user prefix, which is not part of the host', 'https://joe@www.linkedin.com/company/microsoft'],
    // The host on its own names no company, so it cannot be a company's page.
    ['a bare host with no path', 'https://linkedin.com'],
    ['a host with only a trailing slash', 'https://www.linkedin.com/']
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
      ['stray and repeated commas', ',software   ,,   technology,', ['software', 'technology']]
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
  // Individual codes are covered by the loop over the whole list below; what these pin is the
  // case and whitespace handling around them.
  it.each([
    ['lower case', 'us', 'US'],
    ['surrounding whitespace', '  de  ', 'DE']
  ])('accepts a code with %s', (_label: string, input: string, expected: string) => {
    expect(normalizeCountry(input)).toBe(expected)
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
})

describe('normalizeIdentifiers', () => {
  // The company id is normalized straight to the urn LinkedIn is sent, so every spelling a
  // customer might map collapses to one value here rather than being converted again downstream.
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
      organizationUrn: 'urn:li:organization:1035',
      companyPageUrl: 'www.linkedin.com/company/microsoft'
    })
  })

  it('preserves company name casing while lower-casing the domain', () => {
    expect(
      normalizeIdentifiers(payload({ identifiers: { companyName: "McDonald's", companyDomain: 'McD.com' } }))
    ).toEqual({ companyName: "McDonald's", companyDomain: 'mcd.com' })
  })

  it('normalizes a bare company id to the organization urn', () => {
    expect(normalizeIdentifiers(payload({ identifiers: { linkedInCompanyId: '1035' } }))).toEqual({
      organizationUrn: 'urn:li:organization:1035'
    })
  })

  // A LinkedIn organization id is a number, and this is the identifier a customer is most likely
  // to map from the wrong column: the label invites the vanity slug, which is not an id.
  it.each([
    ['a company name', 'Acme Corp'],
    ['a vanity slug', 'microsoft'],
    ['a negative number', '-1'],
    ['a different urn type', 'urn:li:organizationBrand:99'],
    ['an id with a stray character', '1035x']
  ])('drops a company id that is not numeric: %s', (_label: string, linkedInCompanyId: string) => {
    expect(normalizeIdentifiers(payload({ identifiers: { linkedInCompanyId } }))).toEqual({})
  })

  it('drops a company id that is only the urn prefix, with no id behind it', () => {
    expect(normalizeIdentifiers(payload({ identifiers: { linkedInCompanyId: 'urn:li:organization:' } }))).toEqual({})
  })

  // Customers map this field from whatever their warehouse holds, which may be a bare id or a
  // full urn. Both spellings have to behave identically all the way through: the same normalized
  // value, the same dedup key, and the same urn sent to LinkedIn.
  describe('accepts a bare id and a full urn interchangeably', () => {
    const spellings = ['1035', 'urn:li:organization:1035', 'URN:LI:ORGANIZATION:1035', '  urn:li:organization:1035  ']

    it.each(spellings)('normalizes %s to the same urn', (linkedInCompanyId: string) => {
      expect(normalizeIdentifiers(payload({ identifiers: { linkedInCompanyId } }))).toEqual({
        organizationUrn: 'urn:li:organization:1035'
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
    expect(
      JSON.parse(companyKey(keyed({ companyDomain: 'microsoft.com', organizationUrn: 'urn:li:organization:1035' })))
    ).toEqual({
      action: 'ADD',
      companyDomain: 'microsoft.com',
      organizationUrn: 'urn:li:organization:1035'
    })
  })

  it.each([
    ['name', { companyName: 'Microsoft' }, { companyName: 'Microsoft Corp' }],
    ['domain', { companyDomain: 'a.com' }, { companyDomain: 'b.com' }],
    ['email domain', { companyEmailDomain: 'a.com' }, { companyEmailDomain: 'b.com' }],
    ['company id', { organizationUrn: 'urn:li:organization:1' }, { organizationUrn: 'urn:li:organization:2' }],
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
      companyKey(keyed({ organizationUrn: 'urn:li:organization:1035' }))
    )
  })

  it('ignores traits, so the same company collapses whatever its traits say', () => {
    const seattle = keyed({ companyName: 'Microsoft' }, 'ADD', { city: 'Seattle' })
    const austin = keyed({ companyName: 'Microsoft' }, 'ADD', { city: 'Austin' })
    expect(companyKey(seattle)).toBe(companyKey(austin))
  })
})

// 'ü' can be stored two ways: as the single character 'ü', or as a plain 'u' followed by a
// separate accent mark. They look identical but are different data, and LinkedIn matches
// exactly without cleaning up what it is sent, so we always send the single-character form.
describe('unicode normalization', () => {
  // Each pair is the same text twice. Written as escapes on purpose: the two spellings render
  // identically, so as literal characters they would be indistinguishable here. \u00FC is the
  // single character 'u-umlaut'; \u0308 is the umlaut on its own, which renders on top of the
  // plain 'u' before it.
  const domain = { asOneCharacter: 'm\u00FCller.de', asAccentMark: 'mu\u0308ller.de' }
  const city = { asOneCharacter: 'Z\u00FCrich', asAccentMark: 'Zu\u0308rich' }

  it('uses two spellings that really are different data', () => {
    expect(domain.asAccentMark).not.toBe(domain.asOneCharacter)
    expect(domain.asAccentMark).toHaveLength(domain.asOneCharacter.length + 1)
  })

  it('converts a company domain', () => {
    expect(normalizeDomain(domain.asAccentMark)).toBe(domain.asOneCharacter)
  })

  it('converts a company email domain', () => {
    expect(normalizeDomain(`joe@${domain.asAccentMark}`)).toBe(domain.asOneCharacter)
  })

  it('converts a company page url', () => {
    expect(normalizeCompanyPageUrl(`linkedin.com/company/${city.asAccentMark}`)).toBe(
      `linkedin.com/company/${city.asOneCharacter.toLowerCase()}`
    )
  })

  it('converts a company name', () => {
    expect(normalizeIdentifiers(payload({ identifiers: { companyName: city.asAccentMark } }))).toEqual({
      companyName: city.asOneCharacter
    })
  })

  it('converts a city and an industry', () => {
    const company_traits = { city: city.asAccentMark, industries: [city.asAccentMark] }

    expect(normalizeTraits(payload({ send_company_traits: true, company_traits }))).toEqual({
      city: city.asOneCharacter,
      industries: [city.asOneCharacter]
    })
  })

  // Without this, one company mapped in both spellings would sync as two companies. companyKey
  // is given already-normalized identifiers, so the key is taken the way validate() takes it.
  it('treats a company written both ways as one company', () => {
    const fromAccentMark = normalizeIdentifiers(payload({ identifiers: { companyDomain: domain.asAccentMark } }))
    const fromOneCharacter = normalizeIdentifiers(payload({ identifiers: { companyDomain: domain.asOneCharacter } }))

    expect(companyKey(keyed(fromAccentMark))).toBe(companyKey(keyed(fromOneCharacter)))
  })

  it('leaves an ascii value exactly as it is', () => {
    expect(normalizeDomain('microsoft.com')).toBe('microsoft.com')
  })

  // Every pair above is a letter that has a precomposed form, so composing it and leaving it in
  // NFC amount to the same thing. These two do not: lower-casing them produces a form that is
  // composable but not composed, so they fail unless the value is normalized after the case fold
  // rather than only before it.
  it('normalizes a domain after the case fold, not only before it', () => {
    expect(normalizeDomain('H\u0331ELLO.de')).toBe('\u1E96ello.de')
  })

  it('normalizes a page url after the case fold, not only before it', () => {
    expect(normalizeCompanyPageUrl('linkedin.com/company/J\u030COHN')).toBe('linkedin.com/company/\u01F0ohn')
  })

  // Guards the two cases above: if either expected value were itself left decomposed, the
  // assertions would pass while pinning the wrong form.
  it.each(['\u1E96ello.de', 'linkedin.com/company/\u01F0ohn'])('expects a composed value: %s', (expected: string) => {
    expect(expected.normalize('NFC')).toBe(expected)
  })
})
