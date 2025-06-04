type CiSummaryItem = {
  name: string
  required: boolean
  status: string
  reference: string | null
  errors?: string[]
}

export const parseCiSummaryCommentToData = (
  currentReport: string
): { items: CiSummaryItem[]; datetime?: string } => {
  const itemRegex =
    /<!-- ci-item-(.+?)-start -->([\s\S]*?)<!-- ci-item-\1-end -->/g
  const items = []

  // Extract datetime if present
  let datetime = undefined
  const dateMatch = currentReport.match(
    /<p>This comment is created or updated at: (.*?)<\/p>/i
  )
  if (dateMatch && dateMatch[1]) {
    datetime = dateMatch[1]
  }

  // Extract section boundaries more reliably
  const requiredSectionStart = currentReport.indexOf('<h2>Required:</h2>')
  const optionalSectionStart = currentReport.indexOf('<h2>Optional:</h2>')

  // Process each CI item
  let match
  // Clone the regex to reset lastIndex for each run
  const itemRegexClone = new RegExp(itemRegex.source, itemRegex.flags)

  while ((match = itemRegexClone.exec(currentReport)) !== null) {
    const name = match[1]
    const content = match[2]
    const matchPosition = match.index

    // An item is in the Required section if it appears after the Required heading
    // and before the Optional heading
    const required =
      matchPosition > requiredSectionStart &&
      (optionalSectionStart === -1 || matchPosition < optionalSectionStart)

    // Extract status from various patterns
    let status = 'unknown'

    // Check for success indicators with updated emoji ✅
    if (content.match(/✅.*Success/i)) {
      status = 'success'
    }
    // Check for failure indicators with updated emoji ❌
    else if (content.match(/❌.*Failure/i)) {
      status = 'failure'
    }
    // Check for cancelled indicators
    else if (content.match(/⏹.*Cancelled/i)) {
      status = 'cancelled'
    }
    // Check for skipped indicators
    else if (content.match(/➡.*Skipped/i)) {
      status = 'skipped'
    } else if (content.match(/⏳.*Pending/i)) {
      status = 'pending'
    }

    const referenceMatch = content.match(/href=['"](.*?)['"]/)
    const reference = referenceMatch ? referenceMatch[1] : null

    // Extract errors from details section
    let errors: string[] = []
    const errorsMatch = content.match(
      /<details><summary>Errors details \((\d+)\)<\/summary><ul>([\s\S]*?)<\/ul><\/details>/
    )
    if (errorsMatch) {
      const errorsList = errorsMatch[2]
      const errorItems = errorsList.match(/<li>(.*?)<\/li>/g)

      if (errorItems && errorItems.length > 0) {
        errors = errorItems.map(item => {
          // Extract text between <li> and </li> tags
          const errorText = item.replace(/<li>(.*?)<\/li>/, '$1')
          return errorText
        })
      }
    }

    items.push({
      name,
      required,
      status,
      reference,
      errors: errors.length > 0 ? errors : undefined
    })
  }

  return { items, datetime }
}

export const parseCreateOrUpdateTime = (
  currentReport: string
): string | undefined => {
  const dateMatch = currentReport.match(
    /<p>This comment is created or updated at: (.*?)<\/p>/i
  )
  if (dateMatch && dateMatch[1]) {
    return dateMatch[1]
  }
  return undefined
}
