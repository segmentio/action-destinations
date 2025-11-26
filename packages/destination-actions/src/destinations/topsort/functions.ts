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
