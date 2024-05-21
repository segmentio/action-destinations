import { Logger } from '@segment/actions-core/destination-kit'

export function createLoggerMock() {
  return {
    level: 'error',
    name: 'test',
    error: jest.fn() as Logger['error'],
    info: jest.fn() as Logger['info']
  } as Logger
}

export const loggerMock = createLoggerMock()

export function expectLogged(logMethod: Function, ...msgs: string[]) {
  expect(logMethod).toHaveBeenCalledWith(
    expect.stringMatching(new RegExp(`(.*)${msgs.join('(.*)')}(.*)`)),
    expect.anything()
  )
}

export function expectErrorLogged(...msgs: string[]) {
  expectLogged(loggerMock.error, ...msgs)
}
export function expectInfoLogged(...msgs: string[]) {
  expectLogged(loggerMock.info, ...msgs)
}
