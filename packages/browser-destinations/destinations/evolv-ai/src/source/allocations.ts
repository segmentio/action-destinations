import { evolvWrapper } from '../wrapper'
import type { Evolv, Allocation } from '../types'

declare global {
  interface Window {
    evolv: Evolv
  }
}

function getEventKey(eventType: string): string {
  switch (eventType) {
    case 'confirmed':
      return 'experiments.confirmations'
    case 'contaminated':
      return 'experiments.contaminations'
    default:
      return ''
  }
}

function findAllocation(cid: string): Allocation {
  const allocations = evolvWrapper.context.getAllocations()
  return (
    allocations.find((allocation) => allocation.cid === cid) || {
      group_id: '',
      ordinal: '',
      cid: '',
      experiment_name: ''
    }
  )
}

export function extractAllocations(eventType: string): Allocation[] {
  const eventKey = getEventKey(eventType)
  const candidates = evolvWrapper.context.getEvents(eventKey) || []
  return candidates.map(function (candidate): Allocation {
    return findAllocation(candidate.cid)
  })
}
