import {
  companyKey,
  normalizeCompanyPageUrl,
  normalizeCountry,
  normalizeDomain,
  normalizeIdentifiers,
  normalizeIndustries,
  normalizeTraits
} from '../functions'
import { COUNTRY_CODES, MAX_COMPANY_ID_LENGTH, MAX_COMPANY_PAGE_URL_LENGTH } from '../constants'
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
      ['a subdomain and a multi-part tld', 'mail.microsoft.co.uk', 'mail.microsoft.co.uk'],
      ['case and whitespace', '  MICROSOFT.COM  ', 'microsoft.com'],
      ['mailto, which has no slashes after the colon', 'mailto:joe@microsoft.com', 'microsoft.com']
    ])('takes the host from %s', (_label: string, input: string, expected: string) => {
      expect(normalizeDomain(input)).toBe(expected)
    })

    it('takes the part after the last @ when there are several', () => {
      expect(normalizeDomain('weird@name@microsoft.com')).toBe('microsoft.com')
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
    ['only a path', '/about']
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
  // The field carries no format, so a value with or without a scheme reaches here. A scheme other
  // than http(s) leaves its host in place and is rejected by the domain check.
  it.each([
    ['https', 'https://linkedin.com/company/microsoft', 'linkedin.com/company/microsoft'],
    [
      'a percent sign in the slug, sent as written',
      'https://linkedin.com/company/100%-growth',
      'linkedin.com/company/100%-growth'
    ],
    ['a bare host, since the only check is the domain', 'https://linkedin.com', 'linkedin.com'],
    // Without a URL parser the host check is a string suffix test, so a user prefix rides along.
    // Junk in, junk out: it reaches LinkedIn and simply does not match.
    [
      'a user prefix, which still ends in the linkedin.com suffix',
      'https://joe@www.linkedin.com/company/microsoft',
      'joe@www.linkedin.com/company/microsoft'
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
    ['a protocol-relative url, whose host segment is empty', '//linkedin.com/company/microsoft']
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

  // A real organization id is a short number, so an oversized value is a mis-mapped column.
  it('drops a company id longer than the limit rather than stripping it', () => {
    const tooLong = 'a'.repeat(MAX_COMPANY_ID_LENGTH + 1)
    expect(normalizeIdentifiers(payload({ identifiers: { linkedInCompanyId: tooLong } }))).toEqual({})
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
