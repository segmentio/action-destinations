import { MultiStatusResponse } from '@segment/actions-core'
import { handlePartialFailureResponse } from '../functions'

const err = (index?: number) => ({
  message: index === undefined ? 'account not enabled' : `bad conversion ${index}`,
  ...(index === undefined ? {} : { location: { fieldPathElements: [{ fieldName: 'conversions', index }] } })
})

const run = (errors: any[], mapping = [0, 1]) => {
  const msr = new MultiStatusResponse()
  const failed = new Set<number>()
  handlePartialFailureResponse(
    { code: 3, message: 'invalid', details: [{ errors }] },
    mapping,
    msr,
    [{ a: 1 }, { a: 2 }] as any,
    failed,
    'conversions'
  )
  return { failed, msr }
}

describe('handlePartialFailureResponse', () => {
  it('attributes an indexed error to the mapped payload index', () => {
    const { failed, msr } = run([err(1)])
    expect([...failed]).toEqual([1])
    expect(msr.getResponseAtIndex(1).value()).toMatchObject({ errormessage: 'bad conversion 1' })
  })

  it('ignores an error with no resolvable location', () => {
    const { failed } = run([err()])
    expect([...failed]).toEqual([])
  })

  it('ignores an out-of-range index instead of writing a response at undefined', () => {
    const { failed } = run([err(7)])
    expect([...failed]).toEqual([])
  })

  it('handles index 0 (regression: falsy index)', () => {
    const { failed } = run([err(0)])
    expect([...failed]).toEqual([0])
  })

  it('attributes what it can when one error has no location', () => {
    const { failed } = run([err(0), err()])
    expect([...failed]).toEqual([0])
  })
})
