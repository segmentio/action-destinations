export type GenericMethodDecorator<
  TFunc extends (this: any, ...args: any[]) => any = (this: any, ...args: any) => any
> = (
  target: ThisParameterType<TFunc>,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<TFunc>
) => TypedPropertyDescriptor<TFunc> | void
