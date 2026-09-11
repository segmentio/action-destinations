import { MultiStatusResponse } from '@segment/actions-core'
import { handlePartialFailureResponse } from '../functions'

const err = (index?: number) => ({
  message: index === undefined ? 'account not enabled' : `bad conversion ${index}`,
  ...(index === undefined ? {} : { location: { fieldPathElements: [{ fieldName: 'conversions', index }] } })
})

const run = (errors: any[], mapping = [0, 1]) => {
  const msr = new MultiStatusResponse()
  const failed = new Set<number>()
  const out = handlePartialFailureResponse(
    { code: 3, message: 'invalid', details: [{ errors }] },
    mapping,
    msr,
    [{ a: 1 }, { a: 2 }] as any,
    failed,
    'conversions'
  )
  return { out, failed, msr }
}

describe('handlePartialFailureResponse', () => {
  it('attributes an indexed error and reports zero unattributed', () => {
    const { out, failed } = run([err(1)])
    expect(out.unattributedErrorCount).toBe(0)
    expect([...failed]).toEqual([1])
  })

  it('counts an error with no location as unattributed', () => {
    const { out, failed } = run([err()])
    expect(out.unattributedErrorCount).toBe(1)
    expect([...failed]).toEqual([])
  })

  it('counts an out-of-range index as unattributed instead of writing undefined', () => {
    const { out, failed } = run([err(7)])
    expect(out.unattributedErrorCount).toBe(1)
    expect([...failed]).toEqual([])
  })

  it('handles index 0 (regression: falsy index)', () => {
    const { out, failed } = run([err(0)])
    expect(out.unattributedErrorCount).toBe(0)
    expect([...failed]).toEqual([0])
  })

  it('mixes attributed and unattributed errors', () => {
    const { out, failed } = run([err(0), err()])
    expect(out.unattributedErrorCount).toBe(1)
    expect([...failed]).toEqual([0])
  })

  it('returns the underlying reasons for unattributed errors', () => {
    const { out } = run([err(), { message: 'developer token not approved' }])
    expect(out.unattributedErrorMessages).toEqual(['account not enabled', 'developer token not approved'])
  })

  it('falls back to the serialized error when it carries no message', () => {
    const { out } = run([{ code: 7 } as any])
    expect(out.unattributedErrorCount).toBe(1)
    expect(out.unattributedErrorMessages).toEqual(['{"code":7}'])
  })
})
