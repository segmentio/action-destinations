import { eventTracking } from './eventTracking'
import { extractAllocations } from './allocations'
import { Allocation } from '../types'
import { prepareEvent } from './events'

async function emit(eventType: string, allocation: Allocation) {
  if (eventType !== 'confirmed') return

  const event = await prepareEvent(allocation)
  const data = {
    nonInteraction: 1,
    experiment_id: event.group_id,
    experiment_name: event.experiment_name,
    variation_id: event.cid,
    variation_name: `combination ${event.ordinal}`
  }

  if (window.analytics) {
    // console.info('sending track for analytics', data)
    window.analytics
      .track('Experiment Viewed', data, {
        integrations: {
          All: true,
          'Evolv AI Web Mode (Actions)': false
        }
      })
      .then(() => true)
      .catch(() => true)
  } else {
    console.warn('window.analytics not available for track of', data)
  }
}

export function listenForEvolvConfirmation(
  eventTypes: [string] = ['confirmed'],
  uniqueConfirmationsPerSession = false
) {
  const tracking = eventTracking(uniqueConfirmationsPerSession)

  function listenToEvents() {
    eventTypes.forEach(function (eventType) {
      function emitAllocations(allocation: Allocation) {
        try {
          if (!tracking.hasSent(eventType, allocation)) {
            emit(eventType, allocation)
              .then(() => tracking.markAsSent(eventType, allocation))
              .catch(() => true)
          }
        } catch (e) {
          console.info('Evolv: Analytics not sent', e)
        }
      }

      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        window.evolv.client.on(eventType, () => {
          const allocations = extractAllocations(eventType)
          allocations.forEach(emitAllocations)
        })
      } catch (e) {
        console.warn('Evolv not properly initialized (check to make sure uid is available)', e)
      }
    })
  }

  const interval = setInterval(() => {
    if (!window.evolv?.client) return

    clearInterval(interval)
    listenToEvents()
  }, 20)
  setTimeout(() => {
    clearInterval(interval)
  }, 5000)
}
