export async function resolveWhen(condition: () => boolean, timeout?: number): Promise<void> {
  return new Promise((resolve, _reject) => {
    if (condition()) {
      resolve()
      return
    }

    const check = () =>
      setTimeout(() => {
        if (condition()) {
          resolve()
        } else {
          check()
        }
      }, timeout)

    check()
  })
}
