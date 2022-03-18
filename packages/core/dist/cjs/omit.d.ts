export declare function omit<
  T extends
    | object
    | {
        [key: string]: unknown
      },
  K extends string[]
>(obj: T | undefined, keys: K): Omit<T, keyof K>
