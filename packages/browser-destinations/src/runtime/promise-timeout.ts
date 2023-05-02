export function pTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Failed to resolve before ${timeout} ms`))
    }, timeout)

    promise
      .then((val) => {
        clearTimeout(timeoutId)
        return resolve(val)
      })
      .catch(reject)
  })
}
