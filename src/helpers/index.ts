import { uppercaseHelper } from './upper-case'
import { formatDurationHumanReadableHelper } from './duration'
import { eqHelper } from './eq'
import { escapeNewlineHelper } from './escape-newline'

export function registerAllHelpers(): void {
  uppercaseHelper()
  formatDurationHumanReadableHelper()
  eqHelper()
  escapeNewlineHelper()
}
