export function formatName(firstName: unknown, lastName: unknown, name: unknown): unknown {
  return name ?? ([firstName, lastName].filter(Boolean).join(' ') || undefined)
}
