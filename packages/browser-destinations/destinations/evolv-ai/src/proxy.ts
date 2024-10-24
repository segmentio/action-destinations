import { evolvWrapper } from './wrapper'
import type { State } from './types'

const POLL = {
  interval: 20,
  duration: 5000
}

const QUEUE: { event: Array<string>; state: Array<State>; uid: string | null } = {
  event: [],
  state: [],
  uid: null
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
  }, POLL.duration)
}

function processQueues() {
  if (QUEUE.uid) {
    Service.setUser(QUEUE.uid)
  }

  QUEUE.event.forEach(Service.emit)
  QUEUE.state.forEach(Service.bind)

  //cleanup
  QUEUE.uid = null
  QUEUE.event = []
  QUEUE.state = []
}

const Service = {
  emit(event: string) {
    evolvWrapper.client.emit(event)
  },
  bind(state: State) {
    evolvWrapper.context.update(state)
  },
  hasInitializedUser: false,
  setUser(uid: string) {
    if (Service.hasInitializedUser) return

    Service.hasInitializedUser = true
    evolvWrapper.setUid(uid)
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

export function setUser(uid: string) {
  if (checkEvolv()) {
    Service.setUser(uid)
  } else {
    QUEUE.uid = uid
  }
}
