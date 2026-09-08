export const tools = [
  { id: 'network', title: 'Network' },
  { id: 'codex', title: 'Codex' },
] as const

export type ToolId = (typeof tools)[number]['id']
