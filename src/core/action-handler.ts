import * as core from '@actions/core'
import { context } from '@actions/github'
import {
  addCommentToPullRequest,
  getCiSummaryComment,
  getCommentById,
  updateCommentOnPullRequest
} from 'src/client/github'
import {
  parseCiSummaryCommentToData,
  parseCreateOrUpdateTime
} from 'src/helpers/ci-summary'
import { Error } from 'src/types'
import { readJsonFile, readTemplate } from '../utils/file-utils'
import { generateMarkdown } from '../utils/markdown-utils'

// Configuration
const MAX_RETRY_ATTEMPTS = 5
const RETRY_DELAY_MS = 5000

// Types
type WorkflowData = {
  name: string
  required: boolean
  status: string
  htmlURL: string
  errors?: Error[]
}

type ActionInputs = {
  initJsonFilePath: string
  pullRequest: string
  workflow: WorkflowData
}

export async function runAction(): Promise<void> {
  try {
    const inputs = getActionInputs()
    validateInputs(inputs)

    const templateSource = readTemplate('templates/ci-summary-template.hbs')
    const initialData = inputs.initJsonFilePath
      ? readJsonFile(inputs.initJsonFilePath)
      : {}

    const markdown = generateMarkdown(templateSource, {
      ...initialData,
      datetime: new Date().toISOString()
    })
    if (inputs.initJsonFilePath) {
      core.debug(`Initial markdown: ${markdown}`)
    }

    if (inputs.pullRequest && context.eventName === 'pull_request') {
      await handlePullRequestAction(inputs, templateSource, markdown)
    }
  } catch (error) {
    core.debug(`Error: ${JSON.stringify(error)}`)
    handleError(error)
  }
}

function getActionInputs(): ActionInputs {
  const errors = core.getInput('errors')
  const parsedErrors = errors ? JSON.parse(errors) : undefined

  return {
    initJsonFilePath: core.getInput('init-json-file-path'),
    pullRequest: core.getInput('pull-request'),
    workflow: {
      name: core.getInput('name'),
      required: core.getInput('required') === 'true',
      status: core.getInput('status'),
      htmlURL: core.getInput('html-url'),
      errors: parsedErrors
    }
  }
}

function validateInputs(inputs: ActionInputs): void {
  const { initJsonFilePath, workflow } = inputs

  // Validate that init-json-file-path is used exclusively
  if (
    initJsonFilePath &&
    (workflow.name ||
      workflow.required ||
      workflow.status ||
      workflow.htmlURL ||
      workflow.errors)
  ) {
    throw new Error(
      'When providing init-json-file-path, do not provide any workflow-related inputs'
    )
  }

  // Validate required workflow inputs when not using init-json-file-path
  if (
    !initJsonFilePath &&
    (!workflow.name || workflow.required === undefined || !workflow.htmlURL)
  ) {
    throw new Error('Missing required workflow inputs name, required, html-url')
  }
}

/**
 * Handles the action for a pull request context
 */
async function handlePullRequestAction(
  inputs: ActionInputs,
  templateSource: string,
  initialMarkdown: string
): Promise<void> {
  const { initJsonFilePath, workflow } = inputs

  // Initialize with JSON file - create a new comment
  if (initJsonFilePath) {
    await addCommentToPullRequest(
      context.repo.owner,
      context.repo.repo,
      context.issue.number,
      initialMarkdown
    )
    return
  }

  // Update existing comment with new workflow data
  await updateExistingCommentWithRetry(workflow, templateSource)
}

/**
 * Updates an existing CI summary comment with retry logic for handling concurrency
 */
async function updateExistingCommentWithRetry(
  workflow: WorkflowData,
  templateSource: string
): Promise<void> {
  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    // Get the current comment
    const comment = await getCiSummaryComment(context)

    if (!comment) {
      throw new Error(
        'No CI Summary comment found. Please initialize a CI Summary first by running this action with init-json-file-path input.'
      )
    }

    // Parse the current data
    const currentData = parseCiSummaryCommentToData(comment.body)

    // Update workflow data
    const newData = updateWorkflowInSummary(currentData, workflow)

    core.debug(`Current data: ${JSON.stringify(currentData)}`)
    core.debug(`New data: ${JSON.stringify(newData)}`)

    // Generate the new markdown
    const newMarkdown = generateMarkdown(templateSource, {
      ...newData,
      datetime: new Date().toISOString()
    })

    // Add a random delay before updating to avoid potential race conditions
    const maxDelay = 30000 // 30 seconds
    const randomDelay = Math.floor(Math.random() * maxDelay)
    core.info(
      `Adding random delay of ${randomDelay}ms before updating comment to reduce collision probability`
    )
    await sleep(randomDelay)

    // Final verification immediately before update to prevent race conditions
    const commentBeforeUpdate = await getCommentById(
      context,
      Number(comment.id)
    )
    const commentBeforeUpdateDatetime = parseCreateOrUpdateTime(
      commentBeforeUpdate.body
    )

    if (commentBeforeUpdateDatetime !== currentData.datetime) {
      core.info(
        `Detected concurrent update right before committing changes (attempt ${attempt}/${MAX_RETRY_ATTEMPTS})`
      )
      core.debug(`Datetime from parsed comment: ${currentData.datetime}`)
      core.debug(
        `Datetime from newest comment (before update): ${commentBeforeUpdateDatetime}`
      )

      if (attempt < MAX_RETRY_ATTEMPTS) {
        await sleep(RETRY_DELAY_MS * attempt) // Exponential backoff
        continue
      } else {
        throw new Error(
          'Maximum retry attempts reached due to concurrent updates'
        )
      }
    }

    // Update the comment with the new markdown
    await updateCommentOnPullRequest({
      owner: context.repo.owner,
      repo: context.repo.repo,
      comment_id: Number(comment.id),
      body: newMarkdown
    })

    core.info('Successfully updated CI Summary comment')
    core.debug(`New markdown: ${newMarkdown}`)
    return
  }
}

/**
 * Updates or adds a workflow to the summary data
 */
function updateWorkflowInSummary(
  summaryData: { items: any[]; datetime?: string },
  workflow: WorkflowData
): { items: any[]; datetime?: string } {
  const newCIItem = {
    name: workflow.name,
    required: workflow.required,
    status: workflow.status,
    reference: workflow.htmlURL,
    errors: workflow.errors
  }

  const index = summaryData.items.findIndex(item => item.name === workflow.name)

  const updatedItems = [...summaryData.items]
  if (index === -1) {
    updatedItems.push(newCIItem)
  } else {
    updatedItems[index] = newCIItem
  }

  return {
    ...summaryData,
    items: updatedItems
  }
}

function handleError(error: unknown): void {
  if (error instanceof Error) {
    core.setFailed(`Action failed with error: ${error.message}`)
  } else {
    core.setFailed(`Action failed with an unknown error: ${String(error)}`)
  }
}

/**
 * Helper function to sleep for a specified duration
 */
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
