export type Signal = {
  key: string
  title: string
  publisher: string
  channel: string
  stage: string
  type: string
  status: string
  date: string
  tags: string[]
}

export type AppRouteOptions = {
  view: string
  id?: string
  query?: Record<string, string>
  hash?: string
}

export type ViewKey = string

export type NavigateFn = (target: string | AppRouteOptions) => void
