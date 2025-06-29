export interface TemplateData {
  [key: string]: any
}

export type Error = {
  message: string
  severity: string
  code: {
    value: string
  }
  approvals: string[]
  location?: {
    path: string
  }
}
