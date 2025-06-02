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

  let match
  while ((match = itemRegex.exec(currentReport)) !== null) {
    const name = match[1]
    const content = match[2]

    const required =
      /<h2>Required:([\s\S]*?)<\/ul>/i.test(currentReport) &&
      currentReport.indexOf(match[0]) < currentReport.indexOf('</ul>')

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
