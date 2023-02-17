import { flat, Properties } from '../flat'

export const embededObject = () => ({
  firstName: 'John',
  middleName: '',
  lastName: 'Green',
  car: {
    make: 'Honda',
    model: 'Civic',
    year: undefined,
    revisions: [
      { miles: 10150, code: 'REV01', changes: 0, firstTime: true },
      {
        miles: 20021,
        code: 'REV02',
        firstTime: false,
        changes: [
          { type: 'asthetic', desc: 'Left tire cap', price: 123.45 },
          { type: 'mechanic', desc: 'Engine pressure regulator', engineer: null }
        ]
      }
    ]
  },
  visits: [
    { date: '2015-01-01', dealer: 'DEAL-001', useCoupon: true },
    { date: '2015-03-01', dealer: 'DEAL-002' }
  ]
})

export const flattenObject = () => ({
  firstName: 'John',
  middleName: '',
  lastName: 'Green',
  'car.make': 'Honda',
  'car.model': 'Civic',
  'car.revisions.0.miles': '10150',
  'car.revisions.0.code': 'REV01',
  'car.revisions.0.changes': '0',
  'car.revisions.0.firstTime': 'true',
  'car.revisions.1.miles': '20021',
  'car.revisions.1.code': 'REV02',
  'car.revisions.1.firstTime': 'false',
  'car.revisions.1.changes.0.type': 'asthetic',
  'car.revisions.1.changes.0.desc': 'Left tire cap',
  'car.revisions.1.changes.0.price': '123.45',
  'car.revisions.1.changes.1.type': 'mechanic',
  'car.revisions.1.changes.1.desc': 'Engine pressure regulator',
  'car.revisions.1.changes.1.engineer': 'null',
  'visits.0.date': '2015-01-01',
  'visits.0.dealer': 'DEAL-001',
  'visits.0.useCoupon': 'true',
  'visits.1.date': '2015-03-01',
  'visits.1.dealer': 'DEAL-002'
})

describe('flattenObj for ', () => {
  describe('a flat kvp where the value is a ', () => {
    it('undefined', () => {
      expect(flat({ myUndefined: undefined } as Properties)).toEqual({ myUndefined: undefined })
    })

    it('null', () => {
      expect(flat({ myNull: null })).toEqual({ myNull: 'null' })
    })

    it('number', () => {
      expect(flat({ myNumber: 1 })).toEqual({ myNumber: '1' })
    })

    it('string', () => {
      expect(flat({ myString: '1' })).toEqual({ myString: '1' })
    })

    it('boolean', () => {
      expect(flat({ myBool: true })).toEqual({ myBool: 'true' })
    })
  })

  describe('array of ', () => {
    it('nulls:', () => {
      expect(flat({ myNulls: [null, 1, null, 3] })).toEqual({
        'myNulls.0': 'null',
        'myNulls.1': '1',
        'myNulls.2': 'null',
        'myNulls.3': '3'
      })
    })

    it('numbers:', () => {
      expect(flat({ myNumbers: [1, 2, 3, 4] })).toEqual({
        'myNumbers.0': '1',
        'myNumbers.1': '2',
        'myNumbers.2': '3',
        'myNumbers.3': '4'
      })
    })

    it('strings:', () => {
      expect(flat({ myStrings: ['a', '1', 'b', '2'] })).toEqual({
        'myStrings.0': 'a',
        'myStrings.1': '1',
        'myStrings.2': 'b',
        'myStrings.3': '2'
      })
    })

    it('booleans:', () => {
      expect(flat({ myBools: [true, false, true, false] })).toEqual({
        'myBools.0': 'true',
        'myBools.1': 'false',
        'myBools.2': 'true',
        'myBools.3': 'false'
      })
    })
  })

  it('Embedded object', () => {
    const props = embededObject()
    delete props.car.year
    expect(flat(props)).toEqual(flattenObject())
  })

  it('primitive', () => {
    expect(flat(null as unknown as Properties)).toEqual({})
    expect(flat([] as unknown as Properties)).toEqual({})
    expect(flat(1 as unknown as Properties)).toEqual({})
    expect(flat('string' as unknown as Properties)).toEqual({
      '0': 's',
      '1': 't',
      '2': 'r',
      '3': 'i',
      '4': 'n',
      '5': 'g'
    })
    expect(flat(true as unknown as Properties)).toEqual({})
  })
})
