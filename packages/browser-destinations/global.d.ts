declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinOneSecondOf(expected: number | string): R
    }
  }
}

export {}
