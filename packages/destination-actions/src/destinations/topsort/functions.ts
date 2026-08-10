export function NormalizeDeviceType(t: string | undefined): string | undefined {
  if (t === 'ios' || t === 'android') {
    t = 'mobile'
  }
  if (t === 'macos' || t === 'windows') {
    t = 'desktop'
  }
  // Prevents this field from being automatically filled with a value that fails the validation on the Report Events API
  if (t !== 'mobile' && t !== 'desktop') {
    t = undefined
  }
  return t
}

// The Report Events API expects dsp_metadata to be a map of string to string. Coerce any non-string
// values to strings so a single number/object/array value doesn't cause the whole batch to be rejected.
export function NormalizeDspMetadata(
  metadata: { [k: string]: unknown } | undefined
): { [k: string]: string } | undefined {
  if (!metadata) {
    return undefined
  }
  const normalized: { [k: string]: string } = {}
  for (const [key, value] of Object.entries(metadata)) {
    if (value === undefined || value === null) {
      continue
    }
    normalized[key] = typeof value === 'string' ? value : JSON.stringify(value)
  }
  return Object.keys(normalized).length > 0 ? normalized : undefined
}
