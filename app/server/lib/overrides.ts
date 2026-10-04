export interface FieldChange {
  field: string
  oldValue: unknown
  newValue: unknown
}

function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
}

/**
 * Maintains the map of manually edited fields to their original (API) value.
 * The first edit of a field remembers the original value; editing a field back to
 * that original value removes the override again.
 */
export function recordOverrides(
  existing: Record<string, unknown>,
  changes: FieldChange[],
): Record<string, unknown> {
  const result = new Map(Object.entries(existing))
  for (const { field, oldValue, newValue } of changes) {
    if (result.has(field)) {
      if (sameValue(result.get(field), newValue)) {
        result.delete(field)
      }
    }
    else if (!sameValue(oldValue, newValue)) {
      result.set(field, oldValue ?? null)
    }
  }
  return Object.fromEntries(result)
}
