import * as core from '@actions/core'
import { Context } from '@actions/github/lib/context'

export async function createGitHubClient(): Promise<any> {
  const { Octokit } = await import('@octokit/rest')
  const token = core.getInput('repo-token') || process.env.GITHUB_TOKEN

  if (!token) {
    throw new Error('GitHub token is required to authenticate Octokit')
  }

  return new Octokit({ auth: token })
}

export async function addCommentToPullRequest(
  owner: string,
  repo: string,
  pull_number: number,
  body: string
): Promise<any> {
  const octokit = await createGitHubClient()
  const { data } = await octokit.issues.createComment({
    owner,
    repo,
    issue_number: pull_number,
    body
  })
  return data
}

export async function updateCommentOnPullRequest({
  owner,
  repo,
  comment_id,
  body
}: {
  owner: string
  repo: string
  comment_id: number
  body: string
}): Promise<any> {
  const octokit = await createGitHubClient()

  const { data } = await octokit.issues.updateComment({
    owner,
    repo,
    comment_id,
    body
  })

  return data
}

export const getCiSummaryComment = async (context: Context): Promise<any> => {
  const octokit = await createGitHubClient()

  const marker = '<!-- ci-summary-sticky -->'

  const comments = await octokit.paginate(octokit.issues.listComments, {
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.issue.number,
    per_page: 100
  })

  const ciSummaryComment = comments.find((comment: any) =>
    comment.body.includes(marker)
  )

  console.log('DEBUG: ciSummaryComment:', ciSummaryComment.body)

  return ciSummaryComment
}

export const getCommentById = async (
  context: Context,
  comment_id: number
): Promise<any> => {
  const octokit = await createGitHubClient()

  const { data } = await octokit.issues.getComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    comment_id
  })

  console.log('DEBUG: getCommentById:', data.body)

  return data
}
