export enum CachedResponseType {
  Success = 0,
  Error = 1
}

export class CachedValueError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CachedValueError'
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

  toString(): string {
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

  toString(): string {
    return `${super.toString()}${this.seperator}${this.message}${this.seperator}${this.code}`
  }
}

export class CachedValueFactory {
  public static fromString(value: string): CachedValue | CachedError {
    const parts = value.split(':-:')
    if (parts.length < 2) {
      throw new CachedValueError('Invalid cached value')
    }
    const [type, status] = parts
    if (CachedResponseType.Success === +type) {
      return new CachedValue(+status)
    } else if (CachedResponseType.Error === +type) {
      if (parts.length < 4) {
        throw new CachedValueError('Invalid cached value')
      }
      const [message, code] = parts.slice(2)
      return new CachedError(+status, message, code)
    } else {
      throw new CachedValueError('Invalid cached value')
    }
  }
}
