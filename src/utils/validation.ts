/**
 * Generates a temporary ID for new items
 * @returns A temporary ID string
 */
export function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Checks if an ID is a temporary ID
 * @param id - The ID to check
 * @returns true if the ID is temporary, false otherwise
 */
export function isTempId(id: string): boolean {
  return id.startsWith('temp-') || id.startsWith('fallback-')
}

/**
 * Validates if a string is a valid UUID format
 * @param id - The string to validate
 * @returns true if the string is a valid UUID, false otherwise
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  return uuidRegex.test(id)
}
