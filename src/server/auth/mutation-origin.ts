export function isSameOriginMutation(request: Request, appUrl: string) {
  const origin = request.headers.get('origin')

  if (!origin) {
    return false
  }

  try {
    return new URL(origin).origin === new URL(appUrl).origin
  } catch {
    return false
  }
}
