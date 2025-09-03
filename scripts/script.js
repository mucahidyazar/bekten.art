const fs = require('fs')
const path = require('path')

/**
 * Count words in a string (camelCase aware)
 * Examples: "car" = 1, "carSheet" = 2, "myNameIsDe" = 4
 */
function countWords(str) {
  // Handle camelCase by splitting on uppercase letters
  const words = str.split(/(?=[A-Z])/).filter(word => word.length > 0)
  return words.length
}

/**
 * Custom sorting function according to requirements:
 * 1. Alphabetical order
 * 2. Single words first, then by word count
 * 3. Objects at the end
 */
function customSort(a, b) {
  const [keyA, valueA] = a
  const [keyB, valueB] = b

  const isObjectA =
    typeof valueA === 'object' && valueA !== null && !Array.isArray(valueA)
  const isObjectB =
    typeof valueB === 'object' && valueB !== null && !Array.isArray(valueB)

  // If one is object and other is not, object goes last
  if (isObjectA && !isObjectB) return 1
  if (!isObjectA && isObjectB) return -1

  // If both are objects or both are not objects, sort by word count then alphabetically
  const wordsA = countWords(keyA)
  const wordsB = countWords(keyB)

  // First sort by word count
  if (wordsA !== wordsB) {
    return wordsA - wordsB
  }

  // Then alphabetically
  return keyA.localeCompare(keyB)
}

/**
 * Group entries by their word count and object type
 */
function groupEntries(entries) {
  const groups = []
  let currentGroup = []
  let lastWordCount = null
  let lastIsObject = null

  for (const [key, value] of entries) {
    const isObject =
      typeof value === 'object' && value !== null && !Array.isArray(value)
    const wordCount = countWords(key)

    // Start a new group if word count or object type changes
    if (
      lastWordCount !== null &&
      (lastWordCount !== wordCount || lastIsObject !== isObject)
    ) {
      if (currentGroup.length > 0) {
        groups.push(currentGroup)
        currentGroup = []
      }
    }

    currentGroup.push([key, value])
    lastWordCount = wordCount
    lastIsObject = isObject
  }

  // Add the last group
  if (currentGroup.length > 0) {
    groups.push(currentGroup)
  }

  return groups
}

/**
 * Recursively sort JSON object
 */
function sortJsonRecursively(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sortJsonRecursively(item))
  }

  // Convert object to array of [key, value] pairs
  const entries = Object.entries(obj)

  // Sort entries using custom sort function
  entries.sort(customSort)

  // Group entries and create sorted object with blank lines between groups
  const groups = groupEntries(entries)
  const sortedObj = {}

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i]

    // Add entries from this group
    for (const [key, value] of group) {
      sortedObj[key] = sortJsonRecursively(value)
    }

    // Add blank line after each group (except the last one)
    if (i < groups.length - 1) {
      // We'll handle this in the JSON.stringify replacer
    }
  }

  return sortedObj
}

/**
 * Format JSON with blank lines between different word count groups
 */
function formatJsonWithBlankLines(obj, depth = 0) {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return JSON.stringify(obj, null, 2)
  }

  const indent = '  '.repeat(depth)
  const keyIndent = '  '.repeat(depth + 1)

  const entries = Object.entries(obj)
  entries.sort(customSort)
  const groups = groupEntries(entries)

  let result = '{\n'

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i]

    // Add entries from this group
    for (let j = 0; j < group.length; j++) {
      const [key, value] = group[j]
      const isLastInGroup = j === group.length - 1
      const isLastGroup = i === groups.length - 1
      const isLastOverall = isLastInGroup && isLastGroup

      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        // Recursive formatting for nested objects
        const formattedValue = formatJsonWithBlankLines(value, depth + 1)
        result += `${keyIndent}"${key}": ${formattedValue}`
      } else {
        // Simple value formatting
        result += `${keyIndent}"${key}": ${JSON.stringify(value)}`
      }

      // Add comma if not the last item overall
      if (!isLastOverall) {
        result += ','
      }

      result += '\n'
    }

    // Add blank line between groups (except after the last group)
    if (i < groups.length - 1) {
      result += '\n'
    }
  }

  result += indent + '}'
  return result
}

/**
 * Main function to sort JSON file
 */
function sortJsonFile(inputPath, outputPath) {
  try {
    console.log('📁 Reading JSON file from:', inputPath)

    // Read and parse JSON file
    const jsonContent = fs.readFileSync(inputPath, 'utf8')
    const jsonData = JSON.parse(jsonContent)

    console.log('🔄 Sorting JSON data...')

    // Sort the JSON data
    const sortedData = sortJsonRecursively(jsonData)

    console.log('💾 Writing sorted JSON to:', outputPath)

    // Write sorted JSON to output file with pretty formatting and blank lines between groups
    const formattedJson = formatJsonWithBlankLines(sortedData)
    fs.writeFileSync(outputPath, formattedJson, 'utf8')

    console.log('✅ JSON sorting completed successfully!')
    console.log('📊 Sorting rules applied:')
    console.log('   1. Alphabetical order')
    console.log('   2. Single words first, then by word count')
    console.log('   3. Objects placed at the end')
    console.log('   4. Recursive sorting for nested objects')
  } catch (error) {
    console.error('❌ Error occurred during JSON sorting:', error.message)
    process.exit(1)
  }
}

// Main execution
function main() {
  console.log('🚀 Starting JSON Sorter Script')
  console.log('===============================')

  // Define paths
  const projectRoot = path.dirname(__dirname)
  const inputPath = path.join(
    projectRoot,
    'public',
    'locales',
    'en',
    'common.json',
  )
  const outputPath = path.join(__dirname, 'sorted-common.json')

  console.log('📂 Project root:', projectRoot)
  console.log('📥 Input file:', inputPath)
  console.log('📤 Output file:', outputPath)
  console.log('')

  // Check if input file exists
  if (!fs.existsSync(inputPath)) {
    console.error('❌ Input file not found:', inputPath)
    process.exit(1)
  }

  // Sort the JSON file
  sortJsonFile(inputPath, outputPath)
}

// Run the script
if (require.main === module) {
  main()
}

module.exports = {
  sortJsonFile,
  sortJsonRecursively,
  customSort,
  countWords,
}
