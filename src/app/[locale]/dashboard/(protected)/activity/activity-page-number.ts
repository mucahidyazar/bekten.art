const MAX_ACTIVITY_PAGE = 1_000

export function activityPageNumber(value: string | string[] | undefined) {
  const parsed = Number(typeof value === 'string' ? value : '1')

  if (!Number.isInteger(parsed) || parsed < 1) return 1

  return Math.min(parsed, MAX_ACTIVITY_PAGE)
}
