import { Logger } from '@segment/actions-core/destination-kit'

export function getTestLoggerUtils() {
  const loggerMock = {
    level: 'error',
    name: 'test',
    error: jest.fn() as Logger['error'],
    info: jest.fn() as Logger['info']
  } as Logger

  function expectLogged(logMethod: Function, ...msgs: string[]) {
    expect(logMethod).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp(`(.*)${msgs.join('(.*)')}(.*)`)),
      expect.anything()
    )
  }

  function expectErrorLogged(...msgs: string[]) {
    expectLogged(loggerMock.error, ...msgs)
  }

  function expectInfoLogged(...msgs: string[]) {
    expectLogged(loggerMock.info, ...msgs)
  }

  return {
    loggerMock,
    expectErrorLogged,
    expectInfoLogged
  }
}
