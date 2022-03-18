export declare function mapValues<
  Values extends Record<string, any>,
  Obj extends Record<string, Values>,
  ValueKey extends keyof Values
>(
  obj: Obj,
  key: ValueKey
): {
  [K in keyof Obj]: Obj[K][ValueKey]
}
