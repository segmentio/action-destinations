import { Liquid } from 'liquidjs'

const liquidEngine = new Liquid()

export function evaluateLiquid(liquidValue: any, event: any): string {
  const res = liquidEngine.parseAndRenderSync(liquidValue, event)

  console.log('res', res)
  if (typeof res !== 'string') {
    return 'error'
  }

  return res
}
