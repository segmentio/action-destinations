export enum CachedResponseType {
  Success = 0,
  Error = 1
}

export class CachedValueSerializationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CachedValueSerializationError'
  }
}

export class CachedValue {
  public status: number
  public type: CachedResponseType
  protected seperator = ':-:'

  constructor(status: number) {
    this.status = status
    this.type = CachedResponseType.Success
  }

  serialize(): string {
    return `${this.type}${this.seperator}${this.status}`
  }
}

export class CachedError extends CachedValue {
  public message: string
  public code: string
  constructor(status: number, message: string, code: string) {
    super(status)
    this.type = CachedResponseType.Error
    this.code = code
    this.message = message
  }

  serialize(): string {
    return `${super.serialize()}${this.seperator}${this.message}${this.seperator}${this.code}`
  }
}

export class CachedValueFactory {
  public static fromString(value: string): CachedValue | CachedError {
    const parts = value.split(':-:')
    if (parts.length < 2) {
      throw new CachedValueSerializationError(`Invalid cached value ${value}`)
    }
    const [type, status] = parts
    if (CachedResponseType.Success === +type) {
      return new CachedValue(+status)
    } else if (CachedResponseType.Error === +type) {
      if (parts.length < 4) {
        throw new CachedValueSerializationError(`Invalid cached value ${value}`)
      }
      const [message, code] = parts.slice(2)
      return new CachedError(+status, message, code)
    } else {
      throw new CachedValueSerializationError(`Invalid cached value ${value}`)
    }
  }
}
