import { Error } from 'src/types'

type CiSummaryItem = {
  name: string
  required: boolean
  status: string
  reference: string | null
  errors?: Error[]
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

    // Extract errors from details section (table format)
    let errors: Error[] = []
    const errorsMatch = content.match(
      /<details[^>]*><summary>Errors details \((\d+)\)<\/summary><table><thead>[\s\S]*?<\/thead><tbody>([\s\S]*?)<\/tbody><\/table><\/details>/
    )
    if (errorsMatch) {
      const tableBody = errorsMatch[2]
      const tableRows = tableBody.match(/<tr>([\s\S]*?)<\/tr>/g)

      if (tableRows && tableRows.length > 0) {
        errors = tableRows.map(row => {
          const cells = row.match(/<td>([\s\S]*?)<\/td>/g) || []

          // Extract cell contents: Path, Message, Severity, Code, Approvals
          const pathCell = cells[0]?.replace(/<td>([\s\S]*?)<\/td>/, '$1') || ''
          const messageCell =
            cells[1]?.replace(/<td>([\s\S]*?)<\/td>/, '$1') || ''
          const severityCell =
            cells[2]?.replace(/<td>([\s\S]*?)<\/td>/, '$1') || ''
          const codeCell = cells[3]?.replace(/<td>([\s\S]*?)<\/td>/, '$1') || ''
          const approvalsCell =
            cells[4]?.replace(/<td>([\s\S]*?)<\/td>/, '$1') || ''

          // Parse approvals (comma-separated values)
          const approvals =
            approvalsCell === '-'
              ? []
              : approvalsCell
                  .split(',')
                  .map(approval => approval.trim())
                  .filter(Boolean)

          const error: Error = {
            message: messageCell,
            severity: severityCell,
            code: {
              value: codeCell === '-' ? '' : codeCell
            },
            approvals: approvals
          }

          // Add location if path is provided
          if (pathCell && pathCell !== '-') {
            error.location = { path: pathCell }
          }

          return error
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
