import 'jest-browser-globals/build-es5'
import { spyOn } from 'jest-mock'

jest.spyOn = spyOn

global.setImmediate = global.setImmediate || ((fn, ...args) => global.setTimeout(fn, 0, ...args))
window.setImmediate = global.setImmediate
