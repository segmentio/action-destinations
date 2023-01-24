import { normalizePropertyNames } from '../vars'

const suffixToExampleValuesMap: Record<string, any[]> = {
  str: ['some string'],
  bool: [true, false],
  // We include an int value with real example values since real will always be preferred when inferring
  // custom var types from values.
  real: [1, 1.23],
  int: [1],
  date: [new Date()],
  obj: [{}, { secondLevelProp: 'some value' }]
}

suffixToExampleValuesMap.strs = [suffixToExampleValuesMap.str]
suffixToExampleValuesMap.bools = [suffixToExampleValuesMap.bool]
suffixToExampleValuesMap.reals = [suffixToExampleValuesMap.real]
suffixToExampleValuesMap.ints = [suffixToExampleValuesMap.int]
suffixToExampleValuesMap.dates = [suffixToExampleValuesMap.date]
suffixToExampleValuesMap.objs = [suffixToExampleValuesMap.obj]

describe('normalizePropertyNames', () => {
  it('does not add type suffix for undefined values', () => {
    const obj = {
      someProp: undefined
    }
    const normalizedObj = normalizePropertyNames(obj)
    expect(normalizedObj).toEqual(obj)
  })

  it('returns empty object given undefined object', () => {
    expect(normalizePropertyNames(undefined)).toEqual({})
  })

  it('does not add type suffix if known type suffix is present', () => {
    const obj: Record<string, unknown> = {}
    Object.entries(suffixToExampleValuesMap).forEach(([suffix, values]) => {
      values.forEach((value, index) => {
        obj[`prop${index}_${suffix}`] = value
      })
    })
    const normalizedObj = normalizePropertyNames(obj)
    expect(normalizedObj).toEqual(obj)
  })

  it('adds type suffixes when type can be inferred and known type suffix is absent', () => {
    const obj = {
      string_prop: suffixToExampleValuesMap.str[0],
      bool_prop1: suffixToExampleValuesMap.bool[0],
      bool_prop2: suffixToExampleValuesMap.bool[1],
      real_prop1: suffixToExampleValuesMap.real[0],
      real_prop2: suffixToExampleValuesMap.real[1],
      int_prop: suffixToExampleValuesMap.int[0],
      date_prop: suffixToExampleValuesMap.date[0],
      obj_prop1: suffixToExampleValuesMap.obj[0],
      obj_prop2: suffixToExampleValuesMap.obj[1],
      strs_prop: suffixToExampleValuesMap.strs[0],
      bools_prop: suffixToExampleValuesMap.bools[0],
      reals_prop: suffixToExampleValuesMap.reals[0],
      ints_prop: suffixToExampleValuesMap.ints[0],
      dates_prop: suffixToExampleValuesMap.dates[0],
      objs_prop: suffixToExampleValuesMap.objs[0]
    }
    const expected = {
      string_prop_str: obj.string_prop,
      bool_prop1_bool: obj.bool_prop1,
      bool_prop2_bool: obj.bool_prop2,
      real_prop1_real: obj.real_prop1,
      real_prop2_real: obj.real_prop2,
      // This may seem counter-intuitive, but this matches the FullStory client API behavior which prefers
      // reals over ints to avoid inconsistent type inference.
      int_prop_real: obj.int_prop,
      date_prop_date: obj.date_prop,
      obj_prop1_obj: obj.obj_prop1,
      obj_prop2_obj: obj.obj_prop2,
      strs_prop_strs: obj.strs_prop,
      bools_prop_bools: obj.bools_prop,
      reals_prop_reals: obj.reals_prop,
      ints_prop_reals: obj.ints_prop,
      dates_prop_dates: obj.dates_prop,
      objs_prop_objs: obj.objs_prop
    }
    const actual = normalizePropertyNames(obj)
    expect(actual).toEqual(expected)
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
    const actual = normalizePropertyNames(obj, { camelCase: true })
    expect(actual).toEqual(expected)
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

      const actual = normalizePropertyNames(obj)
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

    const actual = normalizePropertyNames(obj, { camelCase: true })
    expect(actual).toEqual(expected)
  })
})
