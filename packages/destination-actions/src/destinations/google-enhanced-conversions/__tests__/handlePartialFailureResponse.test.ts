import { MultiStatusResponse } from '@segment/actions-core'
import { handlePartialFailureResponse } from '../functions'

const err = (index?: number) => ({
  message: index === undefined ? 'account not enabled' : `bad conversion ${index}`,
  ...(index === undefined ? {} : { location: { fieldPathElements: [{ fieldName: 'conversions', index }] } })
})

const run = (errors: any[], mapping = [0, 1]) => {
  const multiStatusResponse = new MultiStatusResponse()
  const failed = new Set<number>()
  handlePartialFailureResponse(
    { code: 3, message: 'invalid', details: [{ errors }] },
    mapping,
    multiStatusResponse,
    [{ a: 1 }, { a: 2 }] as any,
    failed,
    'conversions'
  )
  return { failed, multiStatusResponse }
}

describe('handlePartialFailureResponse', () => {
  it('attributes an indexed error to that payload only', () => {
    expect([...run([err(1)]).failed]).toEqual([1])
  })

  it('handles index 0 (regression: falsy index)', () => {
    expect([...run([err(0)]).failed]).toEqual([0])
  })

  it('ignores an error with no resolvable location', () => {
    expect([...run([err()]).failed]).toEqual([])
  })

  it('ignores an out-of-range index instead of writing at undefined', () => {
    expect([...run([err(7)]).failed]).toEqual([])
  })

  it('attributes only the errors that resolve', () => {
    expect([...run([err(0), err()]).failed]).toEqual([0])
  })
})
