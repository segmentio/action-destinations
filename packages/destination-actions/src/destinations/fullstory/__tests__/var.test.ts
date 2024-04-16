import { normalizePropertyNames } from '../vars'

const suffixToExampleValuesMap: Record<string, any> = {
  str: 'some string',
  strs: ['string 1', 'string 2'],
  bool: true,
  bools: [true, false],
  real: 1.23,
  // We include an int value with real example values since real will always be preferred when inferring
  // custom var types from values.
  reals: [1, 4.56],
  int: 1,
  ints: [2, 3],
  date: new Date(2000, 1),
  dates: [new Date(2000, 2), new Date(2000, 3)],
  obj: {},
  objs: [{}, { nested_string_str: 'nested string' }]
}

describe('normalizePropertyNames', () => {
  it('does not add type suffix for undefined values', () => {
    const obj = {
      someProp: undefined
    }
    const normalizedObj = normalizePropertyNames(obj, { typeSuffix: true })
    expect(normalizedObj).toEqual(obj)
  })

  it('returns empty object given undefined object', () => {
    expect(normalizePropertyNames(undefined)).toEqual({})
  })

  it('does not add type suffix if known type suffix is present', () => {
    const obj: Record<string, unknown> = {}
    Object.entries(suffixToExampleValuesMap).forEach(([suffix, value]) => {
      obj[`${suffix}_prop_${suffix}`] = value
    })
    const normalizedObj = normalizePropertyNames(obj, { typeSuffix: true })
    expect(normalizedObj).toEqual(obj)
  })

  it('does not add type suffix if parameter is undefined/false', () => {
    const originalPayload = {
      str_prop: suffixToExampleValuesMap.str
    }
    const normalizedObj = normalizePropertyNames(originalPayload)
    expect(normalizedObj).toEqual(originalPayload)
    const normalizedObj2 = normalizePropertyNames(originalPayload, { typeSuffix: false })
    expect(normalizedObj2).toEqual(originalPayload)
  })

  it('adds type suffixes when type can be inferred and known type suffix is absent', () => {
    const originalPayload = {
      str_prop: suffixToExampleValuesMap.str,
      strs_prop: suffixToExampleValuesMap.strs,
      bool_prop1: suffixToExampleValuesMap.bool,
      bool_prop2: !suffixToExampleValuesMap.bool,
      bools_prop: suffixToExampleValuesMap.bools,
      real_prop: suffixToExampleValuesMap.real,
      reals_prop: suffixToExampleValuesMap.reals,
      int_prop: suffixToExampleValuesMap.int,
      ints_prop: suffixToExampleValuesMap.ints,
      date_prop: suffixToExampleValuesMap.date,
      dates_prop: suffixToExampleValuesMap.dates,
      obj_prop: suffixToExampleValuesMap.obj,
      objs_prop: suffixToExampleValuesMap.objs
    }

    const expectedPayload = {
      str_prop_str: originalPayload.str_prop,
      strs_prop_strs: originalPayload.strs_prop,
      bool_prop1_bool: originalPayload.bool_prop1,
      bool_prop2_bool: originalPayload.bool_prop2,
      bools_prop_bools: originalPayload.bools_prop,
      real_prop_real: originalPayload.real_prop,
      reals_prop_reals: originalPayload.reals_prop,
      // This may seem counter-intuitive, but this matches the FullStory client API behavior which prefers
      // reals over ints to avoid inconsistent type inference.
      int_prop_real: originalPayload.int_prop,
      ints_prop_reals: originalPayload.ints_prop,
      date_prop_date: originalPayload.date_prop,
      dates_prop_dates: originalPayload.dates_prop,
      // We don't add _obj type suffixes to object properties. This matches FullStory client API behavior.
      obj_prop: originalPayload.obj_prop,
      objs_prop_objs: originalPayload.objs_prop
    }

    const transformedPayload = normalizePropertyNames(originalPayload, { typeSuffix: true })
    expect(transformedPayload).toEqual(expectedPayload)
  })

  it('camel cases when specified', () => {
    const obj = {
      string_str: 'some string',
      moreStrings: ['more', 'strings'],
      last_string_str: 'last string',
      ['hyphenated-bool']: true,
      'dotted.date': new Date(),
      'spaced real': 1.23
    }
    const expected = {
      string_str: obj.string_str,
      moreStrings_strs: obj.moreStrings,
      lastString_str: obj.last_string_str,
      hyphenatedBool_bool: obj['hyphenated-bool'],
      dottedDate_date: obj['dotted.date'],
      spacedReal_real: obj['spaced real']
    }
    const actual = normalizePropertyNames(obj, { camelCase: true, typeSuffix: true })
    expect(actual).toEqual(expected)
  })

  it('type suffixes and camel cases nested properties up to max depth', () => {
    const originalPayload = {
      first: {
        second: {
          third: {
            fourth: {
              fourth_nested: 'some string',
              fifth: {
                fifth_nested: 'some other string'
              }
            }
          }
        }
      }
    }
    const expectedPayload = {
      first: {
        second: {
          third: {
            fourth: {
              fourthNested_str: 'some string',
              fifth: {
                fifth_nested: 'some other string'
              }
            }
          }
        }
      }
    }
    const transformedPayload = normalizePropertyNames(originalPayload, { camelCase: true, typeSuffix: true })
    expect(transformedPayload).toEqual(expectedPayload)
  })

  const unsupportedPropertyNameChars = [' ', '.', '-', ':']

  unsupportedPropertyNameChars.forEach((char) => {
    it(`strips unsupported char '${char}' from property name`, () => {
      const originalNameIncludingTypeSuffix = `type${char}_suffixed${char}${char}_property_str`
      const expectedNamePreservingTypeSuffix = 'type_suffixed_property_str'

      const originalNameExcludingTypeSuffix = `type${char}${char}_without${char}_suffix`
      const expectedNameAddingTypeSuffix = 'type_without_suffix_str'

      const obj = {
        [originalNameIncludingTypeSuffix]: 'some-string',
        [originalNameExcludingTypeSuffix]: 'some-other-string'
      }

      const expected = {
        [expectedNamePreservingTypeSuffix]: obj[originalNameIncludingTypeSuffix],
        [expectedNameAddingTypeSuffix]: obj[originalNameExcludingTypeSuffix]
      }

      const actual = normalizePropertyNames(obj, { typeSuffix: true })
      expect(actual).toEqual(expected)
    })
  })

  it('camel cases before stripping supported property name chars', () => {
    const originalNameIncludingTypeSuffix = 'type.including camel-case:targets_str'
    const expectedNamePreservingTypeSuffix = 'typeIncludingCamelCaseTargets_str'

    const obj = {
      [originalNameIncludingTypeSuffix]: 'some-string'
    }

    const expected = {
      [expectedNamePreservingTypeSuffix]: obj[originalNameIncludingTypeSuffix]
    }

    const actual = normalizePropertyNames(obj, { camelCase: true, typeSuffix: true })
    expect(actual).toEqual(expected)
  })
})
