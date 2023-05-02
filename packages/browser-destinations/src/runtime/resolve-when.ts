import { pTimeout } from './promise-timeout'

/**
 * Will reject if error
 *
 * @param condition - condition after which function will resolve
 * @param checkInterval - how often to check the condition
 * @param timeout - max timeout - should be very generous to allow for slower connections.
 */
export async function resolveWhen(condition: () => boolean, checkInterval: number, timeout = 10000): Promise<void> {
  const p = new Promise((resolve) => {
    if (condition()) {
      resolve(undefined)
      return
    }

    const check = () =>
      setTimeout(() => {
        if (condition()) {
          resolve(undefined)
        } else {
          check()
        }
      }, checkInterval)

    check()
  })
  await pTimeout(p, timeout)
}
