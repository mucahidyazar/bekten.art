type GetConditionalObjectArgs = {
  data: any
  condition: any
}
export function getConditionalObject({ data, condition }: GetConditionalObjectArgs) {
  if (condition) return data
  return {}
}