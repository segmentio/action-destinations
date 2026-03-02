export interface PatchOperation {
  op: 'add' | 'remove'
  path: '/visitors'
  value: string[]
}

export interface BatchPatchBody {
  patch: PatchOperation[]
}

// ---- Batch PATCH response types ----

export interface BatchMultistatusItem {
  status: number
  message: string
  operation: 'add' | 'remove'
}

export interface BatchPatchResponse {
  multistatus: BatchMultistatusItem[]
}

// ---- Single visitor action response ----

export interface VisitorActionResponse {
  message: string
}

// ---- Internal maps for tracking payload indices ----

export type AddMap = Map<number, string>
export type RemoveMap = Map<number, string>
