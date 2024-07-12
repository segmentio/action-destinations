import { evolvWrapper } from './evolv'
import type { State } from './types'

const POLL = {
  interval: 20,
  duration: 5000
}

const QUEUE: { event: Array<string>; state: Array<State> } = {
  event: [],
  state: []
}

let interval: ReturnType<typeof setInterval>
function checkEvolv() {
  if (window.evolv) return !!window.evolv

  if (!interval) {
    pollForEvolv()
  }

  return false
}

function pollForEvolv() {
  interval = setInterval(() => {
    if (window.evolv) {
      processQueues()
      clearInterval(interval)
    }
  }, POLL.interval)
  setTimeout(() => {
    clearInterval(interval)
    console.warn('Evolv: Unable to find evolv snippet')
  })
}

function processQueues() {
  QUEUE.event.forEach(Service.emit)
  QUEUE.state.forEach(Service.bind)
  QUEUE.event = []
  QUEUE.state = []
}

const Service = {
  emit(event: string) {
    evolvWrapper.client.emit(event)
  },
  bind(state: State) {
    evolvWrapper.context.update(state)
  }
}

export function emit(event: string) {
  if (checkEvolv()) {
    Service.emit(event)
  } else {
    QUEUE.event.push(event)
  }
}

export function setValues(state: State) {
  if (checkEvolv()) {
    Service.bind(state)
  } else {
    QUEUE.state.push(state)
  }
}
