// the embeded object contains an undefined value,
// segment only accept JSONValue that excludes undefined
export const embededObject = {
  firstName: 'John',
  middleName: '',
  lastName: 'Green',
  car: {
    make: 'Honda',
    model: 'Civic',
    year: undefined,
    revisions: [
      { miles: 10150, code: 'REV01', changes: 0 },
      {
        miles: 20021,
        code: 'REV02',
        changes: [
          { type: 'asthetic', desc: 'Left tire cap', price: 123.45 },
          { type: 'mechanic', desc: 'Engine pressure regulator', engineer: null }
        ]
      }
    ]
  },
  visits: [
    { date: '2015-01-01', dealer: 'DEAL-001' },
    { date: '2015-03-01', dealer: 'DEAL-002' }
  ]
}
