import * as handlebars from 'handlebars'

export function eqHelper(): void {
  handlebars.registerHelper('eq', function (a, b) {
    return a === b
  })
}
