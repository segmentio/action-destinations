import { Allocation } from '../types'

// {lastInteraction: 1718914875654, sentEvents}
const StorageKey = 'evolv:event_tracking'

export type Tracking = {
  hasSent: (args: string, allocation: Allocation) => boolean
  markAsSent: (args: string, alloction: Allocation) => void
}

type EventCache = { [k: string]: string[] }

let sentEvents: EventCache = {
  //default values - to be updated from localStorage
  confirmed: [],
  contaminated: [],
  others: []
}

function eventList(eventType: string): string[] {
  return sentEvents[eventType] || sentEvents['others']
}

function loadSession() {
  const SessionDuration = 30 * 60 * 1000
  const data = localStorage.getItem(StorageKey)
  const now = new Date().getTime()

  if (!data) return

  const json = JSON.parse(data)
  if (json.lastInteraction + SessionDuration < now) return

  sentEvents = json.sentEvents || sentEvents
}

function updateSession() {
  localStorage.setItem(
    StorageKey,
    JSON.stringify({
      lastInteraction: new Date().getTime(),
      sentEvents
    })
  )
}

function hasSent(eventType: string, allocation: Allocation) {
  const cid = allocation.cid
  return eventList(eventType).includes(cid || eventType)
}

function markAsSentLocal(eventType: string, allocation: Allocation) {
  const cid = allocation.cid
  return eventList(eventType).push(cid || eventType)
}

function markAsSentSession(eventType: string, allocation: Allocation) {
  markAsSentLocal(eventType, allocation)
  updateSession()
}

export function eventTracking(perSessionFlag: boolean): Tracking {
  if (perSessionFlag) {
    loadSession()
    updateSession()
  }
  const markAsSent = perSessionFlag ? markAsSentSession : markAsSentLocal
  return { hasSent, markAsSent }
}
