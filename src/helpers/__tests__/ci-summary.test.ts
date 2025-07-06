import { parseCiSummaryCommentToData } from '../ci-summary'

const input = `
<!-- ci-summary-sticky -->
<h1>CI Summary</h1>

<h2>Required:</h2>
<ul>
      <!-- ci-item-build-dev-start -->
      <li><code>build-dev</code>❌ <strong>Failure</strong> <a href="https://github.com/Thinkei/frontend-core/actions/runs/15831988842">Ref</a></li>
      <!-- ci-item-build-dev-end -->
      <!-- ci-item-run-code-review-bot-start -->
      <li><code>run-code-review-bot</code>❌ <strong>Failure</strong> <a href="https://github.com/Thinkei/frontend-core/actions/runs/16055550791">Ref</a> <details style="display:inline;"><summary>Errors details (2)</summary><table><thead><tr><th>Path</th><th>Message</th><th>Severity</th><th>Code</th><th>Approvals</th></tr></thead><tbody><tr><td>/home/runner/_work/frontend-core/frontend-core/apps/hr-web-app/src/modules/rostering/components/Calendar/Tracks.tsx</td><td>Avoid using absolute color &#x27;#FFFFFF&#x27;.\n\nSemantic color suggestions:\n██ defaultLightBackground (#ffffff), differrence: 0\n██ lightText (#ffffff), differrence: 0\n██ defaultBackground (#f6f6f7), differrence: 15\n██ successBackground (#f0fef4), differrence: 19\n██ errorBackground (#ffeef7), differrence: 19\n\nPalette color suggestions:\n██ white (#ffffff), differrence: 0\n██ greyLight90 (#f6f6f7), differrence: 15\n██ grotesqueGreenLight90 (#f0fef4), differrence: 19\n██ pinkLight90 (#ffeef7), differrence: 19\n██ orangeLight90 (#fff6eb), differrence: 22\n\nTry npx find-semantic-color #FFFFFF to find more semantic colors!</td><td>ERROR</td><td>@ehrocks/eh-linter/avoid-using-absolute-color</td><td>fe-admins</td></tr><tr><td>/home/runner/_work/frontend-core/frontend-core/apps/hr-web-app/src/modules/rostering/components/Calendar/index.tsx</td><td>Avoid using absolute color &#x27;#FFFFFF&#x27;.\n\nSemantic color suggestions:\n██ defaultLightBackground (#ffffff), differrence: 0\n██ lightText (#ffffff), differrence: 0\n██ defaultBackground (#f6f6f7), differrence: 15\n██ successBackground (#f0fef4), differrence: 19\n██ errorBackground (#ffeef7), differrence: 19\n\nPalette color suggestions:\n██ white (#ffffff), differrence: 0\n██ greyLight90 (#f6f6f7), differrence: 15\n██ grotesqueGreenLight90 (#f0fef4), differrence: 19\n██ pinkLight90 (#ffeef7), differrence: 19\n██ orangeLight90 (#fff6eb), differrence: 22\n\nTry npx find-semantic-color #FFFFFF to find more semantic colors!</td><td>ERROR</td><td>@ehrocks/eh-linter/avoid-using-absolute-color</td><td>fe-admins</td></tr></tbody></table></details></li>
      <!-- ci-item-run-code-review-bot-end -->
      <!-- ci-item-run-dangerjs-bot-start -->
      <li><code>run-dangerjs-bot</code>❌ <strong>Failure</strong> <a href="https://github.com/Thinkei/frontend-core/actions/runs/16055550803">Ref</a> <details style="display:inline;"><summary>Errors details (1)</summary><table><thead><tr><th>Path</th><th>Message</th><th>Severity</th><th>Code</th><th>Approvals</th></tr></thead><tbody><tr><td>-</td><td>Invalid PR title</td><td>ERROR</td><td>@invalid-pr-title</td><td>squad-bake, fe-admins</td></tr></tbody></table></details></li>
      <!-- ci-item-run-dangerjs-bot-end -->
</ul>

<h2>Optional:</h2>
<ul>
</ul>

<p>This comment is created or updated at: 2025-07-06T08:27:50.807Z</p>
`

describe('parseCiSummaryCommentToData', () => {
  it('parses required and optional items and errors correctly', () => {
    const result = parseCiSummaryCommentToData(input)

    expect(result.datetime).toBe('2025-07-06T08:27:50.807Z')
    expect(result.items).toEqual([
      {
        name: 'build-dev',
        required: true,
        status: 'failure',
        reference:
          'https://github.com/Thinkei/frontend-core/actions/runs/15831988842',
        errors: undefined
      },
      {
        name: 'run-code-review-bot',
        required: true,
        status: 'failure',
        reference:
          'https://github.com/Thinkei/frontend-core/actions/runs/16055550791',
        errors: [
          {
            message:
              'Avoid using absolute color &#x27;#FFFFFF&#x27;.\n\nSemantic color suggestions:\n██ defaultLightBackground (#ffffff), differrence: 0\n██ lightText (#ffffff), differrence: 0\n██ defaultBackground (#f6f6f7), differrence: 15\n██ successBackground (#f0fef4), differrence: 19\n██ errorBackground (#ffeef7), differrence: 19\n\nPalette color suggestions:\n██ white (#ffffff), differrence: 0\n██ greyLight90 (#f6f6f7), differrence: 15\n██ grotesqueGreenLight90 (#f0fef4), differrence: 19\n██ pinkLight90 (#ffeef7), differrence: 19\n██ orangeLight90 (#fff6eb), differrence: 22\n\nTry npx find-semantic-color #FFFFFF to find more semantic colors!',
            severity: 'ERROR',
            code: { value: '@ehrocks/eh-linter/avoid-using-absolute-color' },
            approvals: ['fe-admins'],
            location: {
              path: '/home/runner/_work/frontend-core/frontend-core/apps/hr-web-app/src/modules/rostering/components/Calendar/Tracks.tsx'
            }
          },
          {
            message:
              'Avoid using absolute color &#x27;#FFFFFF&#x27;.\n\nSemantic color suggestions:\n██ defaultLightBackground (#ffffff), differrence: 0\n██ lightText (#ffffff), differrence: 0\n██ defaultBackground (#f6f6f7), differrence: 15\n██ successBackground (#f0fef4), differrence: 19\n██ errorBackground (#ffeef7), differrence: 19\n\nPalette color suggestions:\n██ white (#ffffff), differrence: 0\n██ greyLight90 (#f6f6f7), differrence: 15\n██ grotesqueGreenLight90 (#f0fef4), differrence: 19\n██ pinkLight90 (#ffeef7), differrence: 19\n██ orangeLight90 (#fff6eb), differrence: 22\n\nTry npx find-semantic-color #FFFFFF to find more semantic colors!',
            severity: 'ERROR',
            code: { value: '@ehrocks/eh-linter/avoid-using-absolute-color' },
            approvals: ['fe-admins'],
            location: {
              path: '/home/runner/_work/frontend-core/frontend-core/apps/hr-web-app/src/modules/rostering/components/Calendar/index.tsx'
            }
          }
        ]
      },
      {
        name: 'run-dangerjs-bot',
        required: true,
        status: 'failure',
        reference:
          'https://github.com/Thinkei/frontend-core/actions/runs/16055550803',
        errors: [
          {
            message: 'Invalid PR title',
            severity: 'ERROR',
            code: { value: '@invalid-pr-title' },
            approvals: ['squad-bake', 'fe-admins']
          }
        ]
      }
    ])
  })
})
