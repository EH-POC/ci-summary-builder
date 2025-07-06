import * as handlebars from 'handlebars'

export const escapeNewlineHelper = () => {
  handlebars.registerHelper('escapeNewline', (text: string) => {
    return text.replace(/\n/g, '\\n')
  })
}
