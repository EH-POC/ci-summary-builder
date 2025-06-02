import * as fs from 'fs'
import * as path from 'path'

export function readTemplate(filePath: string): string {
  if (!filePath.endsWith('.hbs') && !filePath.endsWith('.md')) {
    throw new Error(
      `File must have a handlebars or markdown extension: ${filePath}`
    )
  }
  
  // Resolve path relative to the action's directory structure
  const actionDir = path.dirname(require.resolve('../../package.json'))
  const absolutePath = path.join(actionDir, filePath)
  
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Template file not found: ${absolutePath}`)
  }
  return fs.readFileSync(absolutePath, 'utf-8')
}

export function readJsonFile(filePath: string): any {
  if (!fs.existsSync(filePath)) {
    throw new Error(`JSON file not found: ${filePath}`)
  }
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(fileContent)
}
