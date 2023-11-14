type TimeFormat = 'YYYY-MM-DD' | 'DD MMM YYYY' | 'MMMM DD, YYYY' | 'MM/DD/YYYY' | 'DD/MM/YYYY'
export function formatDate(format: TimeFormat, date: Date) {
  // Check the selected format and format the date accordingly
  if (format == 'YYYY-MM-DD') {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' }
    return date.toLocaleDateString('en-GB', options as any).split('/').reverse().join('-')
  }

  if (format == 'DD MMM YYYY') {
    const options = { day: '2-digit', month: 'short', year: 'numeric' }
    const formattedDate = date.toLocaleDateString('en-US', options as any)
    const [m, d, y] = formattedDate.split(' ')
    return `${d} ${m.toUpperCase()} ${y}`
  }

  if (format == 'MMMM DD, YYYY') {
    const options = { month: 'long', day: 'numeric', year: 'numeric' }
    return date.toLocaleDateString(undefined, options as any)
  }

  if (format == 'MM/DD/YYYY') {
    const options = { month: '2-digit', day: '2-digit', year: 'numeric' }
    return date.toLocaleDateString('en-US', options as any)
  }

  if (format == 'DD/MM/YYYY') {
    return date.toLocaleDateString('en-GB')
  }

  // If the selected format is not valid, display an error message
  return '⛔️ No valid format'
}